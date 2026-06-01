package software.magizhchi.crm.leadform.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.leadform.LeadFormService;
import software.magizhchi.crm.leadform.web.dto.FieldRequest;
import software.magizhchi.crm.leadform.web.dto.FieldResponse;

import java.util.List;
import java.util.UUID;

/** Company-only: design the Add-Lead form (custom fields). */
@RestController
@RequestMapping("/api/v1/lead-form")
public class LeadFormController {

    private final LeadFormService service;

    public LeadFormController(LeadFormService service) {
        this.service = service;
    }

    @GetMapping
    public List<FieldResponse> list() {
        return service.list();
    }

    @PostMapping
    public FieldResponse add(@Valid @RequestBody FieldRequest request) {
        return service.add(request);
    }

    @PutMapping("/{id}")
    public FieldResponse update(@PathVariable UUID id, @Valid @RequestBody FieldRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    public record ReorderRequest(List<UUID> orderedIds) {}

    @PostMapping("/reorder")
    public void reorder(@RequestBody ReorderRequest request) {
        service.reorder(request.orderedIds());
    }

    @PostMapping("/reset")
    public List<FieldResponse> reset() {
        return service.resetToDefault();
    }
}
