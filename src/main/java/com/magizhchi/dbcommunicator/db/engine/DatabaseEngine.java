package com.magizhchi.dbcommunicator.db.engine;

import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;

import java.util.List;

/**
 * Polymorphic interface across SQL and NoSQL backends.
 * Each implementation is a Spring {@code @Component}; the
 * {@link EngineRegistry} indexes them by display name.
 */
public interface DatabaseEngine {

    /** Display names this engine handles (e.g. {"PostgreSQL","MySQL"} for JdbcEngine). */
    List<String> supportedTypes();

    EngineFamily family();

    /** Returns the default port for a given dbType this engine supports, or empty for file-based. */
    String defaultPort(String dbType);

    /** True if the engine doesn't take a host (e.g. SQLite). */
    boolean isFileBased(String dbType);

    /** Short label used in the prompt to describe the query language ("SQL", "MongoDB JSON", …). */
    String queryLanguageName();

    // ----- Lifecycle -----

    void connect(EngineParams params) throws Exception;
    void disconnect();
    boolean isConnected();

    /** Human-readable label shown in the status pill once connected. */
    String connectionDisplayName();

    // ----- Discovery -----

    /** Used to populate the DATABASE combo. Returns empty for engines where the concept doesn't apply. */
    List<String> listDatabases(EngineParams params) throws Exception;

    /** Returns the schema/collection view that drives the sidebar and the prompt context. */
    SchemaSnapshot introspectSchema();

    /** Drop any cached schema so the next {@link #introspectSchema()} is fresh. No-op if no cache. */
    default void invalidateSchemaCache() {}

    // ----- Execution -----

    QueryResult executeQuery(String query) throws Exception;

    // ----- Prompt support -----

    /**
     * Engine-specific clarifications appended to the SQL/AI prompt — e.g. for Mongo:
     * "Return a single line containing the Mongo find/aggregate JSON, e.g. {find:..., filter:...}".
     */
    String engineSpecificPromptRules();
}
