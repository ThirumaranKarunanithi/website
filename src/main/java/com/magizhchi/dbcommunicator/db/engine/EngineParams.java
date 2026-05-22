package com.magizhchi.dbcommunicator.db.engine;

/**
 * Connection parameters passed to every engine. Not every field is
 * meaningful for every engine — SQLite ignores host/port/user/pass;
 * Redis ignores database name and uses {@code dbIndex}; CouchDB
 * ignores everything except host/port/user/pass/database.
 */
public record EngineParams(
        String dbType,     // display name (e.g. "MongoDB", "PostgreSQL")
        String host,
        String port,
        String database,   // db name, file path, service, keyspace, …
        String username,
        String password
) {}
