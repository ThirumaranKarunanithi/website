package software.magizhchi.crm.ingestion.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.ingestion.IngestionService;
import software.magizhchi.crm.ingestion.web.dto.*;

import java.util.List;
import java.util.UUID;

/**
 * Authenticated management of lead sources + Excel/CSV upload.
 * Company accounts only (enforced in the service via TenantContext).
 */
@RestController
@RequestMapping("/api/v1/lead-sources")
public class IngestionAdminController {

    private final IngestionService ingestionService;
    private final ObjectMapper objectMapper;

    public IngestionAdminController(IngestionService ingestionService, ObjectMapper objectMapper) {
        this.ingestionService = ingestionService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<SourceResponse> list() {
        return ingestionService.list();
    }

    @PostMapping
    public SourceResponse create(@Valid @RequestBody CreateSourceRequest request) {
        return ingestionService.create(request);
    }

    @PatchMapping("/{id}/enabled")
    public SourceResponse setEnabled(@PathVariable UUID id, @RequestParam boolean value) {
        return ingestionService.setEnabled(id, value);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        ingestionService.delete(id);
    }

    /** Inspect a file's columns + sample rows (no import) for the mapping UI. */
    @PostMapping(value = "/preview-excel", consumes = "multipart/form-data")
    public PreviewResult previewExcel(@RequestParam("file") MultipartFile file) {
        return ingestionService.preview(file);
    }

    /**
     * Import with an optional column mapping (JSON in the "mapping" form field).
     * If absent, columns are auto-detected.
     */
    @PostMapping(value = "/import-excel", consumes = "multipart/form-data")
    public ImportResult importExcel(@RequestParam("file") MultipartFile file,
                                    @RequestParam(value = "mapping", required = false) String mappingJson) {
        ColumnMapping mapping = null;
        if (mappingJson != null && !mappingJson.isBlank()) {
            try {
                mapping = objectMapper.readValue(mappingJson, ColumnMapping.class);
            } catch (Exception e) {
                throw ApiException.badRequest("Invalid mapping payload.");
            }
        }
        return ingestionService.importExcel(file, mapping);
    }
}
