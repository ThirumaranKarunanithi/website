package com.magizhchi.dbcommunicator.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

/**
 * Owns the single active database connection for the running session.
 * MVP scope: one connection at a time. Multi-connection profiles can be layered on later.
 */
@Component
public class ConnectionManager {

    private static final Logger log = LoggerFactory.getLogger(ConnectionManager.class);

    private HikariDataSource currentDataSource;
    private JdbcTemplate jdbcTemplate;
    private String dbType = "postgresql";
    private String displayName = "(disconnected)";

    public synchronized void connect(String jdbcUrl, String username, String password) {
        closeCurrent();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(5);
        config.setConnectionTimeout(10_000);
        config.setPoolName("magizhchi-pool");

        HikariDataSource ds = new HikariDataSource(config);
        // Force-validate by opening a connection.
        try (Connection c = ds.getConnection()) {
            String productName = c.getMetaData().getDatabaseProductName();
            this.dbType = inferDbType(jdbcUrl, productName);
            this.displayName = productName + " @ " + safeHost(jdbcUrl);
            log.info("Connected to {} ({})", displayName, dbType);
        } catch (Exception e) {
            ds.close();
            throw new ConnectionException("Failed to connect: " + e.getMessage(), e);
        }

        this.currentDataSource = ds;
        this.jdbcTemplate = new JdbcTemplate(ds);
    }

    public synchronized void disconnect() {
        closeCurrent();
        this.displayName = "(disconnected)";
    }

    public synchronized boolean isConnected() {
        return currentDataSource != null && !currentDataSource.isClosed();
    }

    public synchronized JdbcTemplate jdbc() {
        if (jdbcTemplate == null) {
            throw new ConnectionException("Not connected to any database");
        }
        return jdbcTemplate;
    }

    public synchronized DataSource dataSource() {
        return currentDataSource;
    }

    public String getDbType() { return dbType; }
    public String getDisplayName() { return displayName; }

    private void closeCurrent() {
        if (currentDataSource != null) {
            try {
                currentDataSource.close();
            } catch (Exception ignored) {}
            currentDataSource = null;
            jdbcTemplate = null;
        }
    }

    private String inferDbType(String url, String productName) {
        String u = url == null ? "" : url.toLowerCase();
        if (u.startsWith("jdbc:postgresql")) return "PostgreSQL";
        if (u.startsWith("jdbc:mysql")) return "MySQL";
        if (u.startsWith("jdbc:sqlserver")) return "SQL Server";
        if (u.startsWith("jdbc:oracle")) return "Oracle";
        if (u.startsWith("jdbc:sqlite")) return "SQLite";
        return productName != null ? productName : "Unknown";
    }

    private String safeHost(String url) {
        // jdbc:postgresql://host:port/db -> host:port/db
        int idx = url.indexOf("//");
        return idx >= 0 ? url.substring(idx + 2) : url;
    }

    public static class ConnectionException extends RuntimeException {
        public ConnectionException(String message) { super(message); }
        public ConnectionException(String message, Throwable cause) { super(message, cause); }
    }
}
