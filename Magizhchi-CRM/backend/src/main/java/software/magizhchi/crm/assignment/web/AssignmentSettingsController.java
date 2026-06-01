package software.magizhchi.crm.assignment.web;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.assignment.AssignmentSettingsService;
import software.magizhchi.crm.assignment.web.dto.RoutingConfig;

@RestController
@RequestMapping("/api/v1/settings/assignment")
public class AssignmentSettingsController {

    private final AssignmentSettingsService service;

    public AssignmentSettingsController(AssignmentSettingsService service) {
        this.service = service;
    }

    public record ModeResponse(String mode) {}
    public record ModeRequest(@NotBlank String mode) {}

    @GetMapping
    public ModeResponse get() {
        return new ModeResponse(service.getMode());
    }

    @PutMapping
    public ModeResponse set(@RequestBody ModeRequest request) {
        return new ModeResponse(service.setMode(request.mode()));
    }

    /** Full routing config: mode + fallback + field-based routes. */
    @GetMapping("/config")
    public RoutingConfig getConfig() {
        return service.getConfig();
    }

    @PutMapping("/config")
    public RoutingConfig setConfig(@RequestBody RoutingConfig request) {
        return service.setConfig(request);
    }
}
