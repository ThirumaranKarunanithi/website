package com.magizhchi.dbcommunicator.db;

import com.magizhchi.dbcommunicator.config.ConnectionDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * One-shot helper to list databases available on a server, BEFORE we
 * settle on a specific database to connect to. Opens a temporary
 * connection to the engine's "bootstrap" catalog (e.g. {@code postgres},
 * {@code master}), runs the standard catalog query, and closes.
 */
@Component
public class DatabaseLister {

    private static final Logger log = LoggerFactory.getLogger(DatabaseLister.class);

    private final ConnectionDefaults defaults;

    public DatabaseLister(ConnectionDefaults defaults) {
        this.defaults = defaults;
    }

    public List<String> list(String host, String port, String user, String password) {
        return list(defaults.getDbType(), host, port, user, password);
    }

    public List<String> list(String dbType, String host, String port, String user, String password) {
        String type = dbType == null ? "" : dbType.toLowerCase().trim();
        if (type.equals("sqlite")) {
            // File-based — there's no "list" concept; the user types the path.
            return List.of();
        }

        String bootstrap = bootstrapDb(type);
        String url = defaults.buildJdbcUrl(type, host, port, bootstrap);
        String query = catalogQuery(type);

        log.info("Listing databases via {} ({})", url, type);
        DriverManager.setLoginTimeout(5);
        try (Connection c = DriverManager.getConnection(url, user, password);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(query)) {
            List<String> dbs = new ArrayList<>();
            while (rs.next()) dbs.add(rs.getString(1));
            return dbs;
        } catch (Exception e) {
            throw new ListingException("Could not list databases: " + e.getMessage(), e);
        }
    }

    private String bootstrapDb(String dbType) {
        return switch (dbType) {
            case "postgresql", "postgres" -> "postgres";
            case "sql server", "sqlserver", "mssql" -> "master";
            // For MySQL/MariaDB and Oracle we connect without specifying a database;
            // the buildJdbcUrl call will accept an empty value gracefully.
            case "mysql", "mariadb" -> "";
            case "oracle" -> "XE";   // XE is the typical default service on Oracle Express
            default -> "postgres";
        };
    }

    private String catalogQuery(String dbType) {
        return switch (dbType) {
            case "postgresql", "postgres" ->
                    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname";
            case "mysql", "mariadb" ->
                    "SHOW DATABASES";
            case "sql server", "sqlserver", "mssql" ->
                    "SELECT name FROM sys.databases WHERE database_id > 4 ORDER BY name";
            case "oracle" ->
                    // Oracle has schemas rather than databases; list user-owned schemas.
                    "SELECT username FROM all_users WHERE oracle_maintained = 'N' ORDER BY username";
            default -> throw new ListingException(
                    "Listing databases is not supported for db-type '" + dbType + "' yet.", null);
        };
    }

    public static class ListingException extends RuntimeException {
        public ListingException(String message, Throwable cause) { super(message, cause); }
    }
}
