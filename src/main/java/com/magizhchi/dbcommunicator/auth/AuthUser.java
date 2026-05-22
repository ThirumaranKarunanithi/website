package com.magizhchi.dbcommunicator.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Minimal user representation returned by the shared auth service. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuthUser(String id, String email, String name) {
    public String displayName() {
        if (name != null && !name.isBlank()) return name;
        if (email != null && !email.isBlank()) {
            int at = email.indexOf('@');
            return at > 0 ? email.substring(0, at) : email;
        }
        return "User";
    }
}
