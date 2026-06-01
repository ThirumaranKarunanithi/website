package software.magizhchi.crm.ingestion.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

/**
 * Create an ingestion source.
 *  - type:    "API" (web service) or "WEBHOOK"
 *  - channel: for WEBHOOK, one of "INSTAGRAM" / "GOOGLE_FORM" / "GENERIC"; ignored for API
 *  - mapping: optional target->sourceKey overrides, e.g. {"name":"full_name","phone":"phone_number"}
 */
public record CreateSourceRequest(
        @NotBlank String name,
        @NotBlank String type,
        String channel,
        Map<String, String> mapping
) {}
