package software.magizhchi.crm.ingestion.web.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Source view. {@code apiKeyOnce} is non-null ONLY in the create response
 * (the plaintext key is never stored, only its hash). {@code path} is the
 * relative ingest endpoint; the frontend prefixes the current origin.
 */
public record SourceResponse(
        UUID id,
        String name,
        String type,
        String channel,
        boolean enabled,
        String path,
        String apiKeyHeader,
        String apiKeyOnce,
        String webhookToken,
        Map<String, String> mapping,
        Instant createdAt
) {}
