package com.magizhchi.dbcommunicator.db;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads table/column metadata using JDBC DatabaseMetaData, which works across all
 * supported drivers. Result is cached per-connection; refresh on reconnect.
 */
@Component
public class SchemaIntrospector {

    private static final Logger log = LoggerFactory.getLogger(SchemaIntrospector.class);
    private static final int MAX_TABLES = 80;
    private static final int MAX_COLUMNS_PER_TABLE = 40;

    private final ConnectionManager connectionManager;
    private volatile SchemaSnapshot cached;

    public SchemaIntrospector(ConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public SchemaSnapshot snapshot() {
        if (!connectionManager.isConnected()) return new SchemaSnapshot(List.of());
        if (cached != null) return cached;
        return refresh();
    }

    public SchemaSnapshot refresh() {
        DataSource ds = connectionManager.dataSource();
        if (ds == null) return new SchemaSnapshot(List.of());

        List<TableInfo> tables = new ArrayList<>();
        try (Connection c = ds.getConnection()) {
            DatabaseMetaData md = c.getMetaData();
            String catalog = c.getCatalog();
            String schemaPattern = defaultSchemaPattern(md);
            Map<String, List<String>> enums = loadEnumValues(c, md);

            try (ResultSet rs = md.getTables(catalog, schemaPattern, "%", new String[]{"TABLE", "VIEW"})) {
                int count = 0;
                while (rs.next() && count < MAX_TABLES) {
                    String schema = rs.getString("TABLE_SCHEM");
                    String name = rs.getString("TABLE_NAME");
                    String type = rs.getString("TABLE_TYPE");
                    if (isSystemSchema(schema)) continue;

                    List<ColumnInfo> cols = readColumns(md, catalog, schema, name, enums);
                    tables.add(new TableInfo(schema, name, type, cols));
                    count++;
                }
            }
        } catch (Exception e) {
            log.warn("Schema introspection failed: {}", e.getMessage());
        }

        SchemaSnapshot snap = new SchemaSnapshot(tables);
        this.cached = snap;
        log.info("Loaded schema: {} tables/views", tables.size());
        return snap;
    }

    /**
     * For Postgres, fetch every enum type and its allowed values from pg_enum so
     * the prompt can include them. Returns an empty map for non-Postgres engines.
     */
    private Map<String, List<String>> loadEnumValues(Connection c, DatabaseMetaData md) {
        Map<String, List<String>> out = new HashMap<>();
        try {
            String product = md.getDatabaseProductName().toLowerCase();
            if (!product.contains("postgres")) return out;

            String sql =
                    "SELECT t.typname AS type_name, e.enumlabel AS val " +
                    "FROM pg_type t " +
                    "JOIN pg_enum e ON e.enumtypid = t.oid " +
                    "WHERE t.typtype = 'e' " +
                    "ORDER BY t.typname, e.enumsortorder";
            try (Statement s = c.createStatement();
                 ResultSet rs = s.executeQuery(sql)) {
                while (rs.next()) {
                    String typeName = rs.getString("type_name");
                    String val = rs.getString("val");
                    out.computeIfAbsent(typeName, k -> new ArrayList<>()).add(val);
                }
            }
            log.info("Loaded {} enum type(s)", out.size());
        } catch (Exception e) {
            log.debug("Enum introspection skipped: {}", e.getMessage());
        }
        return out;
    }

    public void invalidate() {
        this.cached = null;
    }

    private List<ColumnInfo> readColumns(DatabaseMetaData md, String catalog, String schema, String table,
                                         Map<String, List<String>> enums) throws Exception {
        List<ColumnInfo> cols = new ArrayList<>();
        try (ResultSet rs = md.getColumns(catalog, schema, table, "%")) {
            int count = 0;
            while (rs.next() && count < MAX_COLUMNS_PER_TABLE) {
                String colName = rs.getString("COLUMN_NAME");
                String typeName = rs.getString("TYPE_NAME");
                List<String> enumVals = enums.getOrDefault(typeName, List.of());
                cols.add(new ColumnInfo(colName, typeName, enumVals));
                count++;
            }
        }
        return cols;
    }

    private String defaultSchemaPattern(DatabaseMetaData md) throws Exception {
        String product = md.getDatabaseProductName().toLowerCase();
        if (product.contains("postgres")) return "public";
        if (product.contains("microsoft sql")) return "dbo";
        if (product.contains("oracle")) {
            // Oracle: scope to the connected user's schema; otherwise we'd pull every
            // schema in the database which can be thousands of objects.
            try (java.sql.Statement s = md.getConnection().createStatement();
                 ResultSet rs = s.executeQuery("SELECT USER FROM DUAL")) {
                if (rs.next()) return rs.getString(1);
            } catch (Exception ignored) {}
            return null;
        }
        // MySQL/MariaDB use the connection's current database as catalog; null pattern is fine.
        // SQLite has no schemas; null is fine.
        return null;
    }

    private boolean isSystemSchema(String schema) {
        if (schema == null) return false;
        String s = schema.toLowerCase();
        // PostgreSQL
        if (s.equals("pg_catalog") || s.equals("information_schema") || s.startsWith("pg_")) return true;
        // SQL Server / MySQL
        if (s.equals("sys") || s.equals("mysql") || s.equals("performance_schema")
                || s.equals("information_schema") || s.equals("mssqlsystemresource")) return true;
        // Oracle internal schemas
        if (s.equals("sys") || s.equals("system") || s.equals("dbsnmp") || s.equals("outln")
                || s.equals("xdb") || s.equals("ctxsys") || s.equals("mdsys")
                || s.equals("ordsys") || s.equals("wmsys") || s.equals("appqossys")) return true;
        return false;
    }

    public record ColumnInfo(String name, String type, List<String> enumValues) {
        public ColumnInfo(String name, String type) { this(name, type, List.of()); }
        public boolean isEnum() { return enumValues != null && !enumValues.isEmpty(); }
    }

    public record TableInfo(String schema, String name, String type, List<ColumnInfo> columns) {
        public String qualifiedName() {
            return (schema == null || schema.isBlank()) ? name : schema + "." + name;
        }
    }

    public record SchemaSnapshot(List<TableInfo> tables) {}
}
