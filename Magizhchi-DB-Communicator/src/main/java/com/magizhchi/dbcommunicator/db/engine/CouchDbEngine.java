package com.magizhchi.dbcommunicator.db.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.ColumnInfo;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.TableInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * CouchDB backend. Pure HTTP — uses the built-in {@link HttpClient}
 * plus Jackson (already on the classpath). The LLM emits a Mango
 * query (JSON) which we POST to {@code /{db}/_find}.
 */
@Component
public class CouchDbEngine implements DatabaseEngine {

    private static final Logger log = LoggerFactory.getLogger(CouchDbEngine.class);

    private final ObjectMapper mapper;
    private final HttpClient http;

    private String baseUrl;     // e.g. http://localhost:5984
    private String authHeader;  // Basic xxx (or null for no auth)
    private String currentDb;
    private String displayName = "(disconnected)";

    public CouchDbEngine(ObjectMapper mapper) {
        this.mapper = mapper;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    @Override public List<String> supportedTypes() { return List.of("CouchDB"); }
    @Override public EngineFamily family() { return EngineFamily.COUCHDB; }
    @Override public String defaultPort(String dbType) { return "5984"; }
    @Override public boolean isFileBased(String dbType) { return false; }
    @Override public String queryLanguageName() { return "CouchDB Mango query"; }

    @Override
    public void connect(EngineParams p) {
        String host = (p.host() == null || p.host().isBlank()) ? "localhost" : p.host();
        String port = (p.port() == null || p.port().isBlank()) ? "5984" : p.port();
        this.baseUrl = "http://" + host + ":" + port;
        this.authHeader = buildBasicAuth(p.username(), p.password());
        this.currentDb = p.database() == null ? "" : p.database();

        // Ping
        JsonNode root = getJson("/");
        if (!root.has("couchdb")) {
            throw new RuntimeException("Server at " + baseUrl + " does not look like CouchDB");
        }
        this.displayName = "CouchDB @ " + host + ":" + port
                + (currentDb.isBlank() ? "" : "/" + currentDb);
        log.info("Connected to {}", displayName);
    }

    private String buildBasicAuth(String user, String pass) {
        if (user == null || user.isBlank()) return null;
        String token = user + ":" + (pass == null ? "" : pass);
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void disconnect() {
        baseUrl = null;
        authHeader = null;
        currentDb = null;
        displayName = "(disconnected)";
    }

    @Override public boolean isConnected() { return baseUrl != null; }
    @Override public String connectionDisplayName() { return displayName; }

    @Override
    public List<String> listDatabases(EngineParams p) {
        // Connect-light: build a temporary baseUrl/auth so we don't require a prior connect().
        String host = (p.host() == null || p.host().isBlank()) ? "localhost" : p.host();
        String port = (p.port() == null || p.port().isBlank()) ? "5984" : p.port();
        String prevBase = baseUrl;
        String prevAuth = authHeader;
        baseUrl = "http://" + host + ":" + port;
        authHeader = buildBasicAuth(p.username(), p.password());
        try {
            JsonNode arr = getJson("/_all_dbs");
            List<String> out = new ArrayList<>();
            arr.forEach(n -> {
                String name = n.asText();
                if (!name.startsWith("_")) out.add(name);   // skip _users, _replicator, etc.
            });
            return out;
        } finally {
            baseUrl = prevBase;
            authHeader = prevAuth;
        }
    }

    @Override
    public SchemaSnapshot introspectSchema() {
        if (baseUrl == null || currentDb == null || currentDb.isBlank()) {
            return new SchemaSnapshot(List.of());
        }
        // Sample up to 50 docs and union their top-level fields.
        JsonNode all = getJson("/" + currentDb + "/_all_docs?include_docs=true&limit=50");
        Set<String> fields = new LinkedHashSet<>();
        for (JsonNode row : all.path("rows")) {
            JsonNode doc = row.path("doc");
            Iterator<String> it = doc.fieldNames();
            while (it.hasNext()) fields.add(it.next());
        }
        List<ColumnInfo> cols = new ArrayList<>();
        for (String f : fields) cols.add(new ColumnInfo(f, "json"));
        TableInfo t = new TableInfo(currentDb, currentDb, "DOCUMENT-DB", cols);
        log.info("Sampled CouchDB db={}, {} field(s)", currentDb, cols.size());
        return new SchemaSnapshot(List.of(t));
    }

    @Override
    public QueryResult executeQuery(String query) {
        if (baseUrl == null) throw new IllegalStateException("Not connected to CouchDB");
        if (currentDb == null || currentDb.isBlank()) {
            throw new IllegalStateException("Pick a database first (the DATABASE field).");
        }
        long start = System.currentTimeMillis();
        JsonNode body = postJson("/" + currentDb + "/_find", query.trim());
        long elapsed = System.currentTimeMillis() - start;

        JsonNode docs = body.path("docs");
        Set<String> cols = new LinkedHashSet<>();
        for (JsonNode d : docs) {
            Iterator<String> it = d.fieldNames();
            while (it.hasNext()) cols.add(it.next());
        }
        List<String> columns = new ArrayList<>(cols);
        List<List<Object>> rows = new ArrayList<>();
        for (JsonNode d : docs) {
            List<Object> row = new ArrayList<>(columns.size());
            for (String c : columns) {
                JsonNode v = d.path(c);
                if (v.isMissingNode() || v.isNull()) row.add(null);
                else if (v.isValueNode()) row.add(v.asText());
                else row.add(v.toString());
            }
            rows.add(row);
        }
        return QueryResult.resultSet(columns, rows, elapsed, false);
    }

    // ---------- HTTP helpers ----------

    private JsonNode getJson(String path) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(20))
                    .GET();
            if (authHeader != null) b.header("Authorization", authHeader);
            HttpResponse<String> r = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() / 100 != 2) {
                throw new RuntimeException("CouchDB returned " + r.statusCode() + ": " + r.body());
            }
            return mapper.readTree(r.body());
        } catch (Exception e) {
            throw new RuntimeException("CouchDB GET failed: " + e.getMessage(), e);
        }
    }

    private JsonNode postJson(String path, String body) {
        try {
            // Validate the body parses as JSON (better error message than CouchDB's).
            mapper.readTree(body);

            HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            if (authHeader != null) b.header("Authorization", authHeader);
            HttpResponse<String> r = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() / 100 != 2) {
                throw new RuntimeException("CouchDB returned " + r.statusCode() + ": " + r.body());
            }
            return mapper.readTree(r.body());
        } catch (Exception e) {
            throw new RuntimeException("CouchDB POST failed: " + e.getMessage(), e);
        }
    }

    /** Expose so callers (and the AI) can wrap an ObjectNode body if they prefer. */
    public String renderJson(ObjectNode node) {
        try { return mapper.writeValueAsString(node); }
        catch (Exception e) { throw new RuntimeException(e); }
    }

    @Override
    public String engineSpecificPromptRules() {
        return """

                === COUCHDB MANGO QUERY FORMAT ===
                You are generating CouchDB Mango queries, not SQL.
                - Output a single Mango selector JSON inside a fenced ```json code block.
                - Body shape: {"selector": {...}, "limit": 50, "fields": ["a", "b"]}
                - Supported selectors: $eq, $gt, $gte, $lt, $lte, $ne, $in, $nin, $exists, $regex, $and, $or, $not.
                - Field names must match those shown in the schema above (sampled top-level fields).
                - Example: {"selector": {"type": "user", "age": {"$gt": 30}}, "limit": 25}
                - After the code block, also write the EQUIVALENT SQL on a single line starting with
                  "SQL equivalent: SELECT ..." so users coming from SQL can read the intent.
                """;
    }
}
