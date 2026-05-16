package com.magizhchi.dbcommunicator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Default values pre-filled into the connection form on app start.
 * Users can override per-session in the UI, or change these globally via application.yml.
 */
@ConfigurationProperties(prefix = "magizhchi.connection")
public class ConnectionDefaults {

    private String dbType = "postgresql";
    private String host = "localhost";
    private String port = "5432";
    private String database = "postgres";
    private String username = "postgres";
    private String password = "";

    public String getDbType() { return dbType; }
    public void setDbType(String dbType) { this.dbType = dbType; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public String getPort() { return port; }
    public void setPort(String port) { this.port = port; }

    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    /** Build a JDBC URL using the {@link #getDbType()} configured in application.yml. */
    public String buildJdbcUrl(String host, String port, String database) {
        return buildJdbcUrl(dbType, host, port, database);
    }

    /** Build a JDBC URL for an explicit DB type, ignoring the configured default. */
    public String buildJdbcUrl(String type, String host, String port, String database) {
        String t = type == null ? "" : type.toLowerCase().trim();
        return switch (t) {
            case "postgresql", "postgres" ->
                    "jdbc:postgresql://" + host + ":" + port + "/" + database;
            case "mysql", "mariadb" ->
                    "jdbc:mysql://" + host + ":" + port + "/" + database;
            case "sql server", "sqlserver", "mssql" ->
                    "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + database + ";encrypt=false";
            case "oracle" ->
                    "jdbc:oracle:thin:@//" + host + ":" + port + "/" + database;
            case "sqlite" ->
                    "jdbc:sqlite:" + database;
            default ->
                    "jdbc:" + t + "://" + host + ":" + port + "/" + database;
        };
    }

    /** Default port number for a given DB type, or empty string for file-based engines. */
    public static String defaultPortFor(String type) {
        String t = type == null ? "" : type.toLowerCase().trim();
        return switch (t) {
            case "postgresql", "postgres" -> "5432";
            case "mysql", "mariadb" -> "3306";
            case "sql server", "sqlserver", "mssql" -> "1433";
            case "oracle" -> "1521";
            case "sqlite" -> "";
            default -> "";
        };
    }
}
