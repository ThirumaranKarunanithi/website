package software.magizhchi.crm.settings.web;

import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.settings.VisibilityService;

import java.util.List;

/** Company-only: control which lead fields members can see. */
@RestController
@RequestMapping("/api/v1/settings/visibility")
public class VisibilityController {

    private final VisibilityService service;

    public VisibilityController(VisibilityService service) {
        this.service = service;
    }

    @GetMapping
    public List<VisibilityService.FieldVisibility> list() {
        return service.list();
    }

    public record HiddenRequest(List<String> hidden) {}

    @PutMapping
    public List<VisibilityService.FieldVisibility> set(@RequestBody HiddenRequest req) {
        return service.setHidden(req.hidden());
    }
}
