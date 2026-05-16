package com.magizhchi.dbcommunicator.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The current signed-in session. Serialized to {@code ~/.magizhchi/auth.json}
 * on a successful sign-in so the user stays signed in across launches.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthSession(String token, AuthUser user) {
    public boolean isValid() { return token != null && !token.isBlank() && user != null; }
    public static AuthSession empty() { return new AuthSession(null, null); }
}
