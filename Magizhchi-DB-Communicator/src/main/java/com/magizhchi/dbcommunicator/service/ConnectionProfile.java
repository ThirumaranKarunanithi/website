package com.magizhchi.dbcommunicator.service;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * A named, persistable connection profile. All fields are plain strings
 * so the record serializes cleanly with Jackson. The password is stored
 * Base64-obfuscated on disk (see {@link ConnectionStore}) — this is NOT
 * encryption; it just keeps over-the-shoulder readers honest. AES-backed
 * storage is on the roadmap.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConnectionProfile(
        String name,
        String dbType,
        String host,
        String port,
        String database,
        String username,
        String password
) {
    public ConnectionProfile {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Profile name required");
    }

    public ConnectionProfile withName(String newName) {
        return new ConnectionProfile(newName, dbType, host, port, database, username, password);
    }
}
