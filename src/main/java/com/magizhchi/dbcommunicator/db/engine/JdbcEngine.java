package com.magizhchi.dbcommunicator.db.engine;

import com.magizhchi.dbcommunicator.config.ConnectionDefaults;
import com.magizhchi.dbcommunicator.db.ConnectionManager;
import com.magizhchi.dbcommunicator.db.DatabaseLister;
import com.magizhchi.dbcommunicator.db.QueryExecutor;
import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Adapts every SQL/JDBC backend (PostgreSQL, MySQL, SQL Server, Oracle,
 * SQLite) to the {@link DatabaseEngine} interface by delegating to the
 * existing JDBC components.
 */
@Component
public class JdbcEngine implements DatabaseEngine {

    private final ConnectionManager connectionManager;
    private final SchemaIntrospector schemaIntrospector;
    private final QueryExecutor queryExecutor;
    private final DatabaseLister databaseLister;
    private final ConnectionDefaults defaults;

    public JdbcEngine(ConnectionManager connectionManager,
                      SchemaIntrospector schemaIntrospector,
                      QueryExecutor queryExecutor,
                      DatabaseLister databaseLister,
                      ConnectionDefaults defaults) {
        this.connectionManager = connectionManager;
        this.schemaIntrospector = schemaIntrospector;
        this.queryExecutor = queryExecutor;
        this.databaseLister = databaseLister;
        this.defaults = defaults;
    }

    @Override
    public List<String> supportedTypes() {
        return List.of("PostgreSQL", "MySQL", "SQL Server", "Oracle", "SQLite");
    }

    @Override
    public EngineFamily family() { return EngineFamily.SQL; }

    @Override
    public String defaultPort(String dbType) { return ConnectionDefaults.defaultPortFor(dbType); }

    @Override
    public boolean isFileBased(String dbType) {
        return dbType != null && dbType.equalsIgnoreCase("SQLite");
    }

    @Override
    public String queryLanguageName() { return "SQL"; }

    @Override
    public void connect(EngineParams p) {
        String url = defaults.buildJdbcUrl(p.dbType(), p.host(), p.port(), p.database());
        connectionManager.connect(url, p.username() == null ? "" : p.username(),
                p.password() == null ? "" : p.password());
        schemaIntrospector.invalidate();
    }

    @Override
    public void disconnect() { connectionManager.disconnect(); }

    @Override
    public boolean isConnected() { return connectionManager.isConnected(); }

    @Override
    public String connectionDisplayName() { return connectionManager.getDisplayName(); }

    @Override
    public List<String> listDatabases(EngineParams p) {
        return databaseLister.list(p.dbType(), p.host(), p.port(),
                p.username() == null ? "" : p.username(),
                p.password() == null ? "" : p.password());
    }

    @Override
    public SchemaSnapshot introspectSchema() { return schemaIntrospector.snapshot(); }

    @Override
    public void invalidateSchemaCache() { schemaIntrospector.invalidate(); }

    @Override
    public QueryResult executeQuery(String query) { return queryExecutor.execute(query); }

    @Override
    public String engineSpecificPromptRules() {
        return "";   // The SQL prompt is the default — no engine-specific addendum needed.
    }
}
