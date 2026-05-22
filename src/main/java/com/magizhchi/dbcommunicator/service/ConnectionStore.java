package com.magizhchi.dbcommunicator.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Loads, persists, and mutates saved {@link ConnectionProfile}s. Stored
 * as JSON at <code>~/.magizhchi/connections.json</code>. Passwords are
 * Base64-obfuscated on disk — not encrypted; treat the file as sensitive.
 */
@Service
public class ConnectionStore {

    private static final Logger log = LoggerFactory.getLogger(ConnectionStore.class);
    private static final String PWD_PREFIX = "b64:";

    private final ObjectMapper mapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);
    private final Path storeFile;
    private final List<ConnectionProfile> profiles = new ArrayList<>();

    public ConnectionStore() {
        Path home = Path.of(System.getProperty("user.home"));
        this.storeFile = home.resolve(".magizhchi").resolve("connections.json");
    }

    @PostConstruct
    void load() {
        File f = storeFile.toFile();
        if (!f.exists()) {
            log.info("No saved connections file at {} (this is normal on first run).", storeFile);
            return;
        }
        try {
            List<ConnectionProfile> raw = mapper.readValue(f,
                    new TypeReference<List<ConnectionProfile>>() {});
            profiles.clear();
            for (ConnectionProfile p : raw) profiles.add(deobfuscate(p));
            log.info("Loaded {} saved connection(s) from {}", profiles.size(), storeFile);
        } catch (Exception e) {
            log.warn("Failed to read {} — ignoring: {}", storeFile, e.getMessage());
        }
    }

    public synchronized List<ConnectionProfile> list() {
        return List.copyOf(profiles);
    }

    public synchronized List<String> names() {
        return profiles.stream().map(ConnectionProfile::name).toList();
    }

    public synchronized Optional<ConnectionProfile> findByName(String name) {
        if (name == null) return Optional.empty();
        return profiles.stream().filter(p -> p.name().equalsIgnoreCase(name)).findFirst();
    }

    /** Save (insert or replace by name). Returns the stored profile. */
    public synchronized ConnectionProfile save(ConnectionProfile p) {
        // Replace any existing profile with the same name (case-insensitive).
        profiles.removeIf(existing -> existing.name().equalsIgnoreCase(p.name()));
        profiles.add(p);
        persist();
        return p;
    }

    public synchronized boolean delete(String name) {
        boolean removed = profiles.removeIf(p -> p.name().equalsIgnoreCase(name));
        if (removed) persist();
        return removed;
    }

    private void persist() {
        try {
            Files.createDirectories(storeFile.getParent());
            List<ConnectionProfile> toWrite = profiles.stream().map(this::obfuscate).toList();
            mapper.writerWithDefaultPrettyPrinter().writeValue(storeFile.toFile(), toWrite);
            log.info("Saved {} connection(s) to {}", toWrite.size(), storeFile);
        } catch (IOException e) {
            log.error("Could not persist connections to {}: {}", storeFile, e.getMessage());
            throw new RuntimeException("Could not save connections: " + e.getMessage(), e);
        }
    }

    // ---------- Light password obfuscation ----------
    // Base64 is NOT encryption; it just hides plaintext from casual viewers.
    // Real AES-with-keystore support is on the roadmap.

    private ConnectionProfile obfuscate(ConnectionProfile p) {
        if (p.password() == null || p.password().isEmpty()) return p;
        if (p.password().startsWith(PWD_PREFIX)) return p;   // already obfuscated
        String b64 = Base64.getEncoder().encodeToString(p.password().getBytes(StandardCharsets.UTF_8));
        return new ConnectionProfile(p.name(), p.dbType(), p.host(), p.port(),
                p.database(), p.username(), PWD_PREFIX + b64);
    }

    private ConnectionProfile deobfuscate(ConnectionProfile p) {
        if (p.password() == null || !p.password().startsWith(PWD_PREFIX)) return p;
        try {
            byte[] decoded = Base64.getDecoder().decode(p.password().substring(PWD_PREFIX.length()));
            return new ConnectionProfile(p.name(), p.dbType(), p.host(), p.port(),
                    p.database(), p.username(), new String(decoded, StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.warn("Could not decode stored password for profile '{}', leaving as-is", p.name());
            return p;
        }
    }
}
