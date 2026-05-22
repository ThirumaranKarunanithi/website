package com.magizhchi.dbcommunicator.db.engine;

import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.ColumnInfo;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.TableInfo;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * MongoDB backend. The LLM emits a Mongo runCommand JSON (e.g.
 * {@code {"find":"users","filter":{"age":{"$gt":30}}}}) which we
 * execute via {@link MongoDatabase#runCommand(Document)}. Results
 * are flattened: each returned document is a row, top-level fields
 * are the columns.
 */
@Component
public class MongoEngine implements DatabaseEngine {

    private static final Logger log = LoggerFactory.getLogger(MongoEngine.class);
    private static final int SCHEMA_SAMPLE_SIZE = 50;
    private static final int MAX_COLLECTIONS = 80;

    private MongoClient client;
    private String currentDb = "";
    private String displayName = "(disconnected)";

    @Override
    public List<String> supportedTypes() { return List.of("MongoDB"); }

    @Override
    public EngineFamily family() { return EngineFamily.MONGO; }

    @Override
    public String defaultPort(String dbType) { return "27017"; }

    @Override
    public boolean isFileBased(String dbType) { return false; }

    @Override
    public String queryLanguageName() { return "MongoDB runCommand JSON"; }

    @Override
    public void connect(EngineParams p) {
        disconnect();
        ConnectionString cs = new ConnectionString(buildUri(p));
        MongoClientSettings.Builder builder = MongoClientSettings.builder().applyConnectionString(cs);
        if (p.username() != null && !p.username().isBlank()) {
            builder.credential(MongoCredential.createCredential(
                    p.username(),
                    p.database() == null || p.database().isBlank() ? "admin" : p.database(),
                    p.password() == null ? new char[0] : p.password().toCharArray()));
        }
        this.client = MongoClients.create(builder.build());
        this.currentDb = p.database() == null ? "" : p.database();
        // Force-ping so we fail fast on bad credentials.
        client.getDatabase(currentDb.isBlank() ? "admin" : currentDb)
                .runCommand(new Document("ping", 1));
        this.displayName = "MongoDB @ " + p.host() + ":" + p.port()
                + (currentDb.isBlank() ? "" : "/" + currentDb);
        log.info("Connected to {}", displayName);
    }

    private String buildUri(EngineParams p) {
        // Auth is set via credential builder, so we keep host/port plain here.
        String host = p.host() == null || p.host().isBlank() ? "localhost" : p.host();
        String port = p.port() == null || p.port().isBlank() ? "27017" : p.port();
        return "mongodb://" + host + ":" + port;
    }

    @Override
    public void disconnect() {
        if (client != null) {
            try { client.close(); } catch (Exception ignored) {}
            client = null;
        }
        displayName = "(disconnected)";
    }

    @Override
    public boolean isConnected() { return client != null; }

    @Override
    public String connectionDisplayName() { return displayName; }

    @Override
    public List<String> listDatabases(EngineParams p) {
        // Use a short-lived client so we don't require an existing connection.
        try (MongoClient temp = MongoClients.create(buildUri(p))) {
            List<String> out = new ArrayList<>();
            for (String db : temp.listDatabaseNames()) {
                if (db.equalsIgnoreCase("admin") || db.equalsIgnoreCase("local") || db.equalsIgnoreCase("config")) continue;
                out.add(db);
            }
            return out;
        }
    }

    @Override
    public SchemaSnapshot introspectSchema() {
        if (client == null || currentDb.isBlank()) return new SchemaSnapshot(List.of());
        MongoDatabase db = client.getDatabase(currentDb);

        List<TableInfo> tables = new ArrayList<>();
        int n = 0;
        for (String coll : db.listCollectionNames()) {
            if (n++ >= MAX_COLLECTIONS) break;
            tables.add(introspectCollection(db, coll));
        }
        log.info("Sampled {} Mongo collection(s) in {}", tables.size(), currentDb);
        return new SchemaSnapshot(tables);
    }

    private TableInfo introspectCollection(MongoDatabase db, String name) {
        // Sample documents and union their top-level field names.
        Map<String, String> fieldTypes = new LinkedHashMap<>();
        try (MongoCursor<Document> cur = db.getCollection(name).find().limit(SCHEMA_SAMPLE_SIZE).iterator()) {
            while (cur.hasNext()) {
                Document d = cur.next();
                for (Map.Entry<String, Object> e : d.entrySet()) {
                    fieldTypes.putIfAbsent(e.getKey(),
                            e.getValue() == null ? "null" : e.getValue().getClass().getSimpleName());
                }
            }
        } catch (Exception e) {
            log.debug("Sampling failed for collection {}: {}", name, e.getMessage());
        }
        List<ColumnInfo> cols = new ArrayList<>();
        for (Map.Entry<String, String> e : fieldTypes.entrySet()) {
            cols.add(new ColumnInfo(e.getKey(), e.getValue()));
        }
        return new TableInfo(currentDb, name, "COLLECTION", cols);
    }

    @Override
    public QueryResult executeQuery(String query) {
        if (client == null) throw new IllegalStateException("Not connected to MongoDB");
        if (query == null || query.isBlank()) throw new IllegalArgumentException("Empty query");

        MongoDatabase db = client.getDatabase(currentDb);
        long start = System.currentTimeMillis();
        Document cmd = parseUserQuery(query.trim());
        sanitizeRunCommand(cmd);
        Document result = db.runCommand(cmd);
        long elapsed = System.currentTimeMillis() - start;

        // find/aggregate return a cursor wrapper; getMore is opaque, we only take firstBatch.
        Document cursor = result.get("cursor", Document.class);
        if (cursor != null) {
            @SuppressWarnings("unchecked")
            List<Document> batch = (List<Document>) cursor.get("firstBatch");
            return flatten(batch == null ? List.of() : batch, elapsed);
        }
        // For commands like {count:..} or {distinct:..} we just stringify the response.
        return flatten(List.of(result), elapsed);
    }

    private QueryResult flatten(List<Document> docs, long elapsed) {
        Set<String> cols = new LinkedHashSet<>();
        for (Document d : docs) cols.addAll(d.keySet());
        List<String> columns = new ArrayList<>(cols);
        List<List<Object>> rows = new ArrayList<>(docs.size());
        for (Document d : docs) {
            List<Object> row = new ArrayList<>(columns.size());
            for (String c : columns) {
                Object v = d.get(c);
                row.add(formatCell(v));
            }
            rows.add(row);
        }
        return QueryResult.resultSet(columns, rows, elapsed, false);
    }

    private Object formatCell(Object v) {
        if (v == null) return null;
        if (v instanceof Document doc) return doc.toJson();
        if (v instanceof List<?> list) return list.toString();
        return v;
    }

    /**
     * Post-parse cleanup: strip fields the LLM commonly adds to the wrong
     * command (e.g. {@code "cursor": {}} on {@code find}) and add ones the
     * server requires that the LLM might have omitted.
     *
     * <p>Only {@code aggregate} accepts {@code cursor}; every other command
     * fails with "BSON field is an unknown field" if it's present.
     */
    private void sanitizeRunCommand(Document cmd) {
        if (cmd.isEmpty()) return;
        String firstKey = cmd.keySet().iterator().next();
        String op = firstKey == null ? "" : firstKey.toLowerCase();
        switch (op) {
            case "find":
            case "count":
            case "distinct":
            case "insert":
            case "update":
            case "delete":
                // None of these take a "cursor" field — the LLM keeps adding it anyway.
                cmd.remove("cursor");
                break;
            case "aggregate":
                // aggregate REQUIRES "cursor: {}" (or "explain"). Provide a default if missing.
                if (!cmd.containsKey("cursor") && !cmd.containsKey("explain")) {
                    cmd.put("cursor", new Document());
                }
                break;
            default:
                // Unknown command — leave as-is; runCommand will surface the real error.
        }
    }

    // Matches Mongo shell syntax like `db.users.find({...})` or `users.findAll()`.
    private static final Pattern SHELL_PATTERN = Pattern.compile(
            "^(?:db\\.)?([\\w.$]+)\\.(\\w+)\\s*\\((.*)\\)\\s*;?\\s*$", Pattern.DOTALL);

    /**
     * Try Mongo shell syntax first ({@code db.coll.find({...})} / {@code coll.findAll()});
     * if that doesn't match, fall back to strict-JSON runCommand parsing.
     */
    private Document parseUserQuery(String input) {
        Matcher m = SHELL_PATTERN.matcher(input);
        if (m.matches()) {
            Document shellCmd = shellToCommand(m.group(1), m.group(2), m.group(3).trim());
            if (shellCmd != null) return shellCmd;
        }
        return Document.parse(normalizeShellIsms(input));
    }

    /**
     * Translate a parsed shell call into the equivalent runCommand Document.
     * Returns null if the method isn't recognized — caller falls back to JSON parsing.
     */
    private Document shellToCommand(String collection, String method, String args) {
        String op = method.toLowerCase(Locale.ROOT);
        String[] parts = splitTopLevelArgs(args);
        switch (op) {
            case "find":
            case "findall": {
                Document cmd = new Document("find", collection);
                if (parts.length > 0 && !parts[0].isEmpty()) cmd.put("filter", Document.parse(parts[0]));
                if (parts.length > 1 && !parts[1].isEmpty()) cmd.put("projection", Document.parse(parts[1]));
                return cmd;
            }
            case "findone": {
                Document cmd = new Document("find", collection);
                if (parts.length > 0 && !parts[0].isEmpty()) cmd.put("filter", Document.parse(parts[0]));
                if (parts.length > 1 && !parts[1].isEmpty()) cmd.put("projection", Document.parse(parts[1]));
                cmd.put("limit", 1);
                return cmd;
            }
            case "count":
            case "countdocuments": {
                Document cmd = new Document("count", collection);
                if (parts.length > 0 && !parts[0].isEmpty()) cmd.put("query", Document.parse(parts[0]));
                return cmd;
            }
            case "distinct": {
                if (parts.length < 1) throw new IllegalArgumentException("distinct needs a key, e.g. coll.distinct(\"city\")");
                Document cmd = new Document("distinct", collection)
                        .append("key", parts[0].replaceAll("^[\"']|[\"']$", ""));
                if (parts.length > 1 && !parts[1].isEmpty()) cmd.put("query", Document.parse(parts[1]));
                return cmd;
            }
            case "aggregate": {
                if (parts.length < 1 || parts[0].isEmpty())
                    throw new IllegalArgumentException("aggregate needs a pipeline array");
                // bson driver doesn't expose List parsing for documents directly,
                // so wrap as a temporary doc and pull the list out.
                Document wrapper = Document.parse("{\"pipeline\":" + parts[0] + "}");
                return new Document("aggregate", collection)
                        .append("pipeline", wrapper.get("pipeline"))
                        .append("cursor", new Document());
            }
            case "insertone": {
                if (parts.length < 1) throw new IllegalArgumentException("insertOne needs a document");
                Document wrapper = Document.parse("{\"d\":" + parts[0] + "}");
                return new Document("insert", collection)
                        .append("documents", List.of(wrapper.get("d", Document.class)));
            }
            case "insertmany": {
                if (parts.length < 1) throw new IllegalArgumentException("insertMany needs a documents array");
                Document wrapper = Document.parse("{\"docs\":" + parts[0] + "}");
                return new Document("insert", collection).append("documents", wrapper.get("docs"));
            }
            case "deleteone":
            case "deletemany": {
                if (parts.length < 1) throw new IllegalArgumentException(method + " needs a filter");
                Document delEntry = new Document("q", Document.parse(parts[0]))
                        .append("limit", op.equals("deleteone") ? 1 : 0);
                return new Document("delete", collection).append("deletes", List.of(delEntry));
            }
            case "updateone":
            case "updatemany": {
                if (parts.length < 2)
                    throw new IllegalArgumentException(method + " needs a filter and an update document");
                Document upd = new Document("q", Document.parse(parts[0]))
                        .append("u", Document.parse(parts[1]))
                        .append("multi", op.equals("updatemany"));
                return new Document("update", collection).append("updates", List.of(upd));
            }
            default:
                return null;   // unknown method — let JSON fallback have a try
        }
    }

    /**
     * Split a shell-method argument string on top-level commas only.
     * Commas inside strings or nested braces/brackets are ignored.
     */
    private String[] splitTopLevelArgs(String s) {
        if (s == null || s.isEmpty()) return new String[0];
        List<Integer> commas = new ArrayList<>();
        int depth = 0;
        boolean inString = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inString) {
                if (c == '\\') { i++; continue; }
                if (c == '"') inString = false;
            } else {
                if (c == '"') inString = true;
                else if (c == '{' || c == '[' || c == '(') depth++;
                else if (c == '}' || c == ']' || c == ')') depth--;
                else if (c == ',' && depth == 0) commas.add(i);
            }
        }
        if (commas.isEmpty()) return new String[]{s.trim()};
        List<String> out = new ArrayList<>();
        int start = 0;
        for (int idx : commas) {
            out.add(s.substring(start, idx).trim());
            start = idx + 1;
        }
        out.add(s.substring(start).trim());
        return out.toArray(new String[0]);
    }

    /**
     * The LLM often emits Mongo *shell* syntax (e.g. {@code ObjectId()},
     * {@code ISODate(...)}) or driver-method names (e.g. {@code insertMany})
     * inside what should be a strict-JSON runCommand body. Translate the
     * common ones so {@link Document#parse(String)} can succeed.
     */
    private String normalizeShellIsms(String q) {
        // Driver-style method names → runCommand operation names.
        q = q.replaceAll("\"insertMany\"", "\"insert\"")
             .replaceAll("\"updateMany\"", "\"update\"")
             .replaceAll("\"deleteMany\"", "\"delete\"")
             .replaceAll("\"insertOne\"", "\"insert\"")
             .replaceAll("\"updateOne\"", "\"update\"")
             .replaceAll("\"deleteOne\"", "\"delete\"");

        // ObjectId("hex") → extended JSON {"$oid":"hex"}.
        q = q.replaceAll("ObjectId\\(\\s*\"([0-9a-fA-F]+)\"\\s*\\)",
                "{\"\\$oid\":\"$1\"}");
        // ObjectId() with no argument → drop the whole entry so Mongo auto-generates _id.
        // Matches a `_id` key followed by ObjectId() plus any trailing comma.
        q = q.replaceAll("\"_id\"\\s*:\\s*ObjectId\\(\\s*\\)\\s*,\\s*", "");
        q = q.replaceAll(",\\s*\"_id\"\\s*:\\s*ObjectId\\(\\s*\\)\\s*", "");
        q = q.replaceAll("\"_id\"\\s*:\\s*ObjectId\\(\\s*\\)\\s*", "");

        // ISODate("...") → {"$date":"..."} (extended JSON canonical form).
        q = q.replaceAll("ISODate\\(\\s*\"([^\"]+)\"\\s*\\)",
                "{\"\\$date\":\"$1\"}");

        // NumberLong/NumberInt — strip the wrapper, keep the numeric value.
        q = q.replaceAll("NumberLong\\(\\s*(-?\\d+)\\s*\\)", "$1");
        q = q.replaceAll("NumberInt\\(\\s*(-?\\d+)\\s*\\)", "$1");
        q = q.replaceAll("NumberDecimal\\(\\s*\"?([\\-0-9.eE]+)\"?\\s*\\)", "$1");

        return q;
    }

    @Override
    public String engineSpecificPromptRules() {
        return """

                === MONGODB QUERY FORMAT ===
                You are generating MongoDB **runCommand** JSON, NOT shell syntax and NOT driver method names.

                - Output a single runCommand JSON document inside a fenced ```json code block.
                - The output must be STRICT JSON — no Mongo shell helpers, no comments, no trailing commas.

                Use these EXACT command names (these are the runCommand operations, not driver methods):

                Reads (note which fields each command accepts):
                    {"find": "users", "filter": {"age": {"$gt": 30}}, "limit": 50}
                      // find: takes "filter", "projection", "sort", "limit", "skip". NO "cursor" field.
                    {"count": "users", "query": {"active": true}}
                      // count: takes "query". NO "cursor".
                    {"distinct": "users", "key": "city"}
                      // distinct: takes "key" and "query". NO "cursor".
                    {"aggregate": "orders", "pipeline": [{"$match": {"status": "paid"}}, {"$group": {"_id": "$customer", "total": {"$sum": "$amount"}}}], "cursor": {}}
                      // aggregate: REQUIRES "cursor": {} as the last field (or use "explain").

                Writes (commands are SINGULAR — never insertMany/updateMany/deleteMany):
                    {"insert": "students", "documents": [{"name": "Alice", "age": 18}, {"name": "Bob", "age": 19}]}
                    {"update": "students", "updates": [{"q": {"name": "Alice"}, "u": {"$set": {"age": 19}}, "multi": true}]}
                    {"delete": "students", "deletes": [{"q": {"name": "Alice"}, "limit": 0}]}

                CRITICAL JSON rules:
                - NEVER write `ObjectId(...)`, `ISODate(...)`, `NumberLong(...)` — these are Mongo SHELL syntax, not JSON.
                - For ObjectId, OMIT the `_id` field entirely so Mongo generates one automatically.
                - For dates, use extended JSON: `{"$date": "2024-01-01T00:00:00Z"}`.
                - Use plain numbers for integers; do not wrap them.

                Other rules:
                - The collection name is the VALUE of "find"/"insert"/"update"/etc., never qualified with a schema.
                - Field names in filters/documents must match the sampled fields shown in the schema.
                - After the code block, also write the EQUIVALENT SQL on a single line starting with
                  "SQL equivalent: ..." so users coming from SQL can read the intent.
                """;
    }
}
