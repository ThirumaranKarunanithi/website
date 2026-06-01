package software.magizhchi.crm.ingestion.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.ingestion.IngestionService;

import java.util.Map;
import java.util.UUID;

/**
 * Public (unauthenticated) intake endpoints. Auth is per-source:
 *  - API:     X-API-Key header
 *  - WEBHOOK: ?token= query param (Instagram / Google Form / generic)
 * These paths are permitted in SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1")
public class IngestionPublicController {

    private final IngestionService ingestionService;

    public IngestionPublicController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/ingest/{sourceId}/leads")
    public ResponseEntity<Map<String, Object>> ingestApi(
            @PathVariable UUID sourceId,
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody(required = false) Map<String, Object> body) {
        ingestionService.ingestApi(sourceId, apiKey, body == null ? Map.of() : body);
        return ResponseEntity.ok(Map.of("status", "accepted"));
    }

    @PostMapping("/webhooks/{sourceId}")
    public ResponseEntity<Map<String, Object>> ingestWebhook(
            @PathVariable UUID sourceId,
            @RequestParam(value = "token", required = false) String token,
            @RequestBody(required = false) Map<String, Object> body) {
        ingestionService.ingestWebhook(sourceId, token, body == null ? Map.of() : body);
        return ResponseEntity.ok(Map.of("status", "accepted"));
    }
}
