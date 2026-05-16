package com.magizhchi.dbcommunicator.db.engine;

import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.ColumnInfo;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.TableInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.IntStream;

/**
 * Redis backend. The LLM emits a single Redis command string
 * (e.g. {@code GET user:42}, {@code HGETALL session:abc}). We
 * dispatch the most common read commands to typed Jedis methods
 * and format the response as a table.
 */
@Component
public class RedisEngine implements DatabaseEngine {

    private static final Logger log = LoggerFactory.getLogger(RedisEngine.class);
    private static final int SCAN_SAMPLE = 200;

    private Jedis jedis;
    private int dbIndex = 0;
    private String displayName = "(disconnected)";

    @Override public List<String> supportedTypes() { return List.of("Redis"); }
    @Override public EngineFamily family() { return EngineFamily.REDIS; }
    @Override public String defaultPort(String dbType) { return "6379"; }
    @Override public boolean isFileBased(String dbType) { return false; }
    @Override public String queryLanguageName() { return "Redis command"; }

    @Override
    public void connect(EngineParams p) {
        disconnect();
        String host = (p.host() == null || p.host().isBlank()) ? "localhost" : p.host();
        int port = parseInt(p.port(), 6379);
        this.jedis = new Jedis(host, port, 5000);
        if (p.password() != null && !p.password().isBlank()) {
            jedis.auth(p.password());
        }
        this.dbIndex = parseDbIndex(p.database());
        if (dbIndex > 0) jedis.select(dbIndex);
        jedis.ping();
        this.displayName = "Redis @ " + host + ":" + port + "/db" + dbIndex;
        log.info("Connected to {}", displayName);
    }

    private int parseInt(String s, int fallback) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return fallback; }
    }

    private int parseDbIndex(String s) {
        if (s == null || s.isBlank()) return 0;
        try {
            int i = Integer.parseInt(s.trim());
            return (i >= 0 && i <= 15) ? i : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public void disconnect() {
        if (jedis != null) {
            try { jedis.close(); } catch (Exception ignored) {}
            jedis = null;
        }
        displayName = "(disconnected)";
    }

    @Override public boolean isConnected() { return jedis != null; }
    @Override public String connectionDisplayName() { return displayName; }

    @Override
    public List<String> listDatabases(EngineParams p) {
        // Redis exposes 16 logical DBs by default. Numbered 0..15.
        return IntStream.range(0, 16).mapToObj(String::valueOf).toList();
    }

    @Override
    public SchemaSnapshot introspectSchema() {
        if (jedis == null) return new SchemaSnapshot(List.of());

        // SCAN up to SCAN_SAMPLE keys, group by Redis type so the prompt has structure to work with.
        Map<String, List<String>> byType = new TreeMap<>();
        ScanParams params = new ScanParams().count(50);
        String cursor = ScanParams.SCAN_POINTER_START;
        int scanned = 0;
        do {
            ScanResult<String> r = jedis.scan(cursor, params);
            for (String key : r.getResult()) {
                if (scanned++ >= SCAN_SAMPLE) break;
                String type = jedis.type(key);
                byType.computeIfAbsent(type, k -> new ArrayList<>()).add(key);
            }
            cursor = r.getCursor();
        } while (!cursor.equals("0") && scanned < SCAN_SAMPLE);

        List<TableInfo> tables = new ArrayList<>();
        for (Map.Entry<String, List<String>> e : byType.entrySet()) {
            List<ColumnInfo> cols = new ArrayList<>();
            for (String key : e.getValue()) cols.add(new ColumnInfo(key, e.getKey()));
            tables.add(new TableInfo("db" + dbIndex, e.getKey(), "KEY-GROUP", cols));
        }
        log.info("Sampled {} key(s) across {} type(s)", scanned, byType.size());
        return new SchemaSnapshot(tables);
    }

    @Override
    public QueryResult executeQuery(String query) {
        if (jedis == null) throw new IllegalStateException("Not connected to Redis");
        if (query == null || query.isBlank()) throw new IllegalArgumentException("Empty command");

        long start = System.currentTimeMillis();
        String[] parts = query.trim().split("\\s+");
        String cmd = parts[0].toUpperCase(Locale.ROOT);

        QueryResult result = switch (cmd) {
            case "GET" ->     singleValue("value", jedis.get(arg(parts, 1)));
            case "MGET" ->    singleColumn("value", jedis.mget(tail(parts, 1)));
            case "KEYS" ->    singleColumn("key", new ArrayList<>(jedis.keys(arg(parts, 1))));
            case "TYPE" ->    singleValue("type", jedis.type(arg(parts, 1)));
            case "TTL" ->     singleValue("ttl_seconds", jedis.ttl(arg(parts, 1)));
            case "EXISTS" ->  singleValue("exists", jedis.exists(arg(parts, 1)));
            case "STRLEN" ->  singleValue("length", jedis.strlen(arg(parts, 1)));
            case "HGETALL" -> pairs("field", "value", jedis.hgetAll(arg(parts, 1)));
            case "HGET" ->    singleValue("value", jedis.hget(arg(parts, 1), arg(parts, 2)));
            case "HKEYS" ->   singleColumn("field", new ArrayList<>(jedis.hkeys(arg(parts, 1))));
            case "HLEN" ->    singleValue("count", jedis.hlen(arg(parts, 1)));
            case "LRANGE" ->  singleColumn("element", jedis.lrange(arg(parts, 1),
                                    parseInt(arg(parts, 2), 0), parseInt(arg(parts, 3), -1)));
            case "LLEN" ->    singleValue("length", jedis.llen(arg(parts, 1)));
            case "SMEMBERS" -> singleColumn("member", new ArrayList<>(jedis.smembers(arg(parts, 1))));
            case "SCARD" ->   singleValue("count", jedis.scard(arg(parts, 1)));
            case "ZRANGE" ->  singleColumn("member", jedis.zrange(arg(parts, 1),
                                    parseInt(arg(parts, 2), 0), parseInt(arg(parts, 3), -1)));
            case "DBSIZE" ->  singleValue("count", jedis.dbSize());
            case "INFO" ->    singleValue("info", jedis.info());
            case "PING" ->    singleValue("response", jedis.ping());
            default -> throw new IllegalArgumentException(
                    "Unsupported Redis command in this slice: " + cmd
                    + ". Supported: GET, MGET, KEYS, TYPE, TTL, EXISTS, STRLEN, "
                    + "HGETALL, HGET, HKEYS, HLEN, LRANGE, LLEN, SMEMBERS, SCARD, ZRANGE, DBSIZE, INFO, PING");
        };
        long elapsed = System.currentTimeMillis() - start;
        return QueryResult.resultSet(result.columns(), result.rows(), elapsed, false);
    }

    private String arg(String[] parts, int i) {
        if (i >= parts.length) throw new IllegalArgumentException("Missing argument at position " + i);
        return parts[i];
    }

    private String[] tail(String[] parts, int from) {
        if (parts.length <= from) return new String[0];
        String[] out = new String[parts.length - from];
        System.arraycopy(parts, from, out, 0, out.length);
        return out;
    }

    private QueryResult singleValue(String colName, Object value) {
        return QueryResult.resultSet(List.of(colName),
                List.of(List.of(value == null ? "(nil)" : value.toString())), 0, false);
    }

    private QueryResult singleColumn(String colName, List<?> values) {
        List<List<Object>> rows = new ArrayList<>(values.size());
        for (Object v : values) rows.add(List.of(v == null ? "(nil)" : v.toString()));
        return QueryResult.resultSet(List.of(colName), rows, 0, false);
    }

    private QueryResult pairs(String keyCol, String valCol, Map<String, String> map) {
        List<List<Object>> rows = new ArrayList<>(map.size());
        for (Map.Entry<String, String> e : map.entrySet()) {
            rows.add(List.of(e.getKey(), e.getValue() == null ? "(nil)" : e.getValue()));
        }
        return QueryResult.resultSet(List.of(keyCol, valCol), rows, 0, false);
    }

    @Override
    public String engineSpecificPromptRules() {
        return """

                === REDIS COMMAND FORMAT ===
                You are generating Redis commands, not SQL.
                - Output a SINGLE Redis command on one line inside a fenced ```redis (or ```text) code block.
                - Supported read commands: GET, MGET, KEYS, TYPE, TTL, EXISTS, STRLEN,
                  HGETALL, HGET, HKEYS, HLEN, LRANGE, LLEN, SMEMBERS, SCARD, ZRANGE, DBSIZE, INFO, PING.
                - Key names should match the keys shown in the schema above (grouped by Redis type).
                - Example: `HGETALL user:42`, `LRANGE queue:work 0 -1`, `KEYS session:*`.
                - After the code block, also write the EQUIVALENT SQL on a single line starting with
                  "SQL equivalent: SELECT ..." so users coming from SQL can read the intent.
                """;
    }
}
