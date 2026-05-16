package com.magizhchi.dbcommunicator.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configurable bindings for the shared Magizhchi auth service. Endpoints used:
 *   POST   {base-url}/api/auth/signup   {email,password,name}     -> {token,user}
 *   POST   {base-url}/api/auth/signin   {email,password}          -> {token,user}
 *   GET    {base-url}/api/auth/me       Authorization: Bearer …    -> {user}
 *
 * The exact endpoint paths can be tweaked in {@link AuthClient} if the shared
 * service uses different routes once it's deployed.
 */
@ConfigurationProperties(prefix = "magizhchi.auth")
public class AuthProperties {

    /** When false, the app skips the sign-in screen entirely (dev/offline mode). */
    private boolean enabled = true;

    /** Shared auth service base URL — flip when the real service is live. */
    private String baseUrl = "https://magizhchi.software";

    /** Connect/read timeout for auth HTTP calls. */
    private int timeoutSeconds = 15;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int t) { this.timeoutSeconds = t; }
}
