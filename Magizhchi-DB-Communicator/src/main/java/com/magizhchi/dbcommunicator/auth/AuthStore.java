package com.magizhchi.dbcommunicator.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/**
 * Reads/writes the auth session to {@code ~/.magizhchi/auth.json} so the user
 * stays signed in across launches.
 *
 * <p>Same caveat as {@code ConnectionStore}: this file is sensitive — anyone
 * with read access to it can copy the token and impersonate the user against
 * the shared auth service. AES-encrypted-at-rest is the next slice.
 */
@Service
public class AuthStore {

    private static final Logger log = LoggerFactory.getLogger(AuthStore.class);

    private final ObjectMapper mapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);
    private final Path storeFile;
    private AuthSession current = AuthSession.empty();

    public AuthStore() {
        Path home = Path.of(System.getProperty("user.home"));
        this.storeFile = home.resolve(".magizhchi").resolve("auth.json");
    }

    @PostConstruct
    void load() {
        File f = storeFile.toFile();
        if (!f.exists()) return;
        try {
            AuthSession s = mapper.readValue(f, AuthSession.class);
            if (s != null && s.isValid()) {
                current = s;
                log.info("Restored auth session for {}", s.user().displayName());
            }
        } catch (Exception e) {
            log.warn("Couldn't read {}: {}", storeFile, e.getMessage());
        }
    }

    public synchronized Optional<AuthSession> current() {
        return current.isValid() ? Optional.of(current) : Optional.empty();
    }

    public synchronized void save(AuthSession session) {
        this.current = session;
        try {
            Files.createDirectories(storeFile.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(storeFile.toFile(), session);
        } catch (Exception e) {
            log.error("Couldn't persist auth session: {}", e.getMessage());
        }
    }

    public synchronized void clear() {
        this.current = AuthSession.empty();
        try { Files.deleteIfExists(storeFile); }
        catch (Exception e) { log.debug("Couldn't delete {}: {}", storeFile, e.getMessage()); }
    }
}
