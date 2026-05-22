package com.magizhchi.dbcommunicator.db.engine;

/**
 * Coarse-grained family classification used to decide UI affordances
 * and prompt templates. SQL engines all share JDBC, schemas, and the
 * existing SQL prompt; NoSQL engines each have their own conventions.
 */
public enum EngineFamily {
    SQL,        // PostgreSQL, MySQL, SQL Server, Oracle, SQLite
    MONGO,      // MongoDB (document store, JSON queries)
    REDIS,      // Redis (key/value, command strings)
    COUCHDB     // CouchDB (document store, HTTP + Mango)
}
