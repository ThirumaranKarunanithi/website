package com.magizhchi.dbcommunicator.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * HTTP client for the shared Magizhchi auth service. Wraps three REST calls:
 *   POST  {base}/api/auth/signup
 *   POST  {base}/api/auth/signin
 *   GET   {base}/api/auth/me   (verifies a stored token is still valid)
 *
 * If the endpoints differ when the service is deployed, just tweak the paths
 * below — the contract stays the same.
 */
@Component
public class AuthClient {

    private static final Logger log = LoggerFactory.getLogger(AuthClient.class);

    private final AuthProperties props;
    private final ObjectMapper mapper;
    private final HttpClient http;

    public AuthClient(AuthProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Ask the shared Magizhchi Share auth service to email a one-time code.
     * Tries the LOGIN endpoint first (existing users). If that fails — most
     * commonly because the email isn't registered yet — falls back to the
     * REGISTER endpoint (creating a pending account).
     *
     * @return true if this triggered a new-account registration, false if it
     *         was a login OTP. The caller passes this back to {@link #verifyOtp}.
     */
    public boolean requestOtp(String email, String displayName, String mobileNumber) {
        // 1. Try login first (existing user).
        try {
            ObjectNode loginBody = mapper.createObjectNode().put("identifier", email);
            call("POST", "/api/auth/login/send-otp", loginBody.toString(), null, "Send login OTP");
            return false;   // existing user — use the login verify path
        } catch (AuthException loginErr) {
            log.debug("Login send-OTP failed, trying register: {}", loginErr.getMessage());
            // 2. Fall back to register (new user).
            ObjectNode regBody = mapper.createObjectNode()
                    .put("email", email)
                    .put("displayName", (displayName == null || displayName.isBlank())
                            ? email.split("@")[0]
                            : displayName)
                    .put("mobileNumber", mobileNumber == null ? "" : mobileNumber)
                    .put("otpChannel", "EMAIL");
            try {
                call("POST", "/api/auth/register/send-otp", regBody.toString(), null,
                        "Send registration OTP");
                return true;   // new user — use the register verify path
            } catch (AuthException regErr) {
                // Re-throw the registration error (it has the most actionable detail).
                throw regErr;
            }
        }
    }

    /**
     * Verify the 6-digit code. Routes to the correct Share endpoint depending
     * on whether the OTP was sent via the login or registration flow (the
     * caller learned this from {@link #requestOtp}'s return value).
     */
    public AuthSession verifyOtp(String email, String otp, boolean isNewUser) {
        String path = isNewUser ? "/api/auth/register/verify" : "/api/auth/login/verify";
        ObjectNode body = mapper.createObjectNode()
                .put("identifier", email)
                .put("code", otp);
        return call("POST", path, body.toString(), null, "Verify OTP");
    }

    /** Verify a stored token is still valid. Returns refreshed user info on success. */
    public AuthSession verify(AuthSession existing) {
        if (existing == null || !existing.isValid()) return null;
        try {
            AuthSession out = call("GET", "/api/users/me", null, existing.token(), "Verify");
            // Share's /api/users/me returns the user only — keep the existing token.
            if (out != null && out.token() == null) {
                return new AuthSession(existing.token(), out.user());
            }
            return out;
        } catch (AuthException e) {
            return null;
        }
    }

    private AuthSession call(String method, String path, String body, String bearerToken, String label) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(props.getBaseUrl() + path))
                    .timeout(Duration.ofSeconds(props.getTimeoutSeconds()))
                    .header("Accept", "application/json");
            if (body != null) {
                b.header("Content-Type", "application/json");
                b.method(method, HttpRequest.BodyPublishers.ofString(body));
            } else {
                b.method(method, HttpRequest.BodyPublishers.noBody());
            }
            if (bearerToken != null) b.header("Authorization", "Bearer " + bearerToken);

            HttpResponse<String> r = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() / 100 != 2) {
                String respBody = r.body();
                String msg = extractError(respBody);
                // If the server returned HTML, the endpoint probably isn't a JSON API
                // (most often: the auth service simply isn't deployed at this URL yet).
                if (msg == null && isHtml(respBody)) {
                    if (r.statusCode() == 404) {
                        throw new AuthException(
                                "The Magizhchi auth service isn't reachable at "
                                + props.getBaseUrl() + path + ".\n"
                                + "Check your internet connection or contact support if the issue persists.");
                    }
                    throw new AuthException(
                            label + " failed: the server returned an HTML page (status "
                            + r.statusCode() + ") instead of a JSON response. "
                            + "Check that `magizhchi.auth.base-url` points to a deployed auth service.");
                }
                throw new AuthException(label + " failed (HTTP " + r.statusCode() + "): "
                        + (msg == null ? "no details from server" : msg));
            }
            JsonNode root = r.body() == null || r.body().isBlank()
                    ? mapper.createObjectNode()
                    : mapper.readTree(r.body());
            // Token: prefer `accessToken` (Magizhchi Share), fall back to `token`.
            String token = root.path("accessToken").asText(null);
            if (token == null || token.isBlank()) token = root.path("token").asText(null);
            // User: Share returns fields flat (userId, displayName, email, mobileNumber, profilePhotoUrl).
            //       Older shape: nested under `user`. Accept both.
            AuthUser user = parseUser(root);
            return new AuthSession(token, user);
        } catch (java.net.ConnectException ce) {
            throw new AuthException("Couldn't reach " + props.getBaseUrl()
                    + " — check your internet connection.");
        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            log.warn("{} call failed", label, e);
            throw new AuthException(label + " failed: " + e.getMessage());
        }
    }

    private String extractError(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            JsonNode root = mapper.readTree(body);
            for (String f : new String[]{"error", "message", "detail"}) {
                JsonNode n = root.path(f);
                if (!n.isMissingNode() && !n.isNull()) return n.asText();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private boolean isHtml(String body) {
        if (body == null) return false;
        String t = body.trim().toLowerCase();
        return t.startsWith("<!doctype") || t.startsWith("<html");
    }

    /**
     * Parse the user portion of an auth response. Handles two shapes:
     * <ul>
     *   <li>Magizhchi Share: fields flat at the top level — {@code userId,
     *       displayName, email, mobileNumber, profilePhotoUrl}.</li>
     *   <li>Older / nested: {@code user: { id, email, name }}.</li>
     * </ul>
     */
    private AuthUser parseUser(JsonNode root) {
        // Nested shape first.
        if (root.has("user") && root.get("user").isObject()) {
            return readUser(root.get("user"));
        }
        // Flat shape (Magizhchi Share).
        if (root.has("userId") || root.has("displayName") || root.has("email")) {
            return readUser(root);
        }
        return null;
    }

    private AuthUser readUser(JsonNode node) {
        String id = firstNonBlank(
                node.path("id").asText(null),
                node.path("userId").asText(null));
        String email = node.path("email").asText(null);
        String name = firstNonBlank(
                node.path("name").asText(null),
                node.path("displayName").asText(null));
        return new AuthUser(id, email, name);
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank() && !"null".equals(v)) return v;
        }
        return null;
    }

    public static class AuthException extends RuntimeException {
        public AuthException(String message) { super(message); }
    }
}
