package software.magizhchi.crm.mailtemplate.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.mailtemplate.MailMerge;
import software.magizhchi.crm.mailtemplate.MailTemplateService;
import software.magizhchi.crm.mailtemplate.web.dto.TemplateRequest;
import software.magizhchi.crm.mailtemplate.web.dto.TemplateResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MailTemplateController {

    private final MailTemplateService service;

    public MailTemplateController(MailTemplateService service) {
        this.service = service;
    }

    // ---- Company CRUD ----

    @GetMapping("/mail-templates")
    public List<TemplateResponse> list() {
        return service.list();
    }

    @GetMapping("/mail-templates/variables")
    public List<String> variables() {
        return MailMerge.availableVars();
    }

    @PostMapping("/mail-templates")
    public TemplateResponse create(@Valid @RequestBody TemplateRequest request) {
        return service.create(request);
    }

    @PutMapping("/mail-templates/{id}")
    public TemplateResponse update(@PathVariable UUID id, @Valid @RequestBody TemplateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/mail-templates/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    // ---- Member/company: templates for a company + send to a lead ----

    @GetMapping("/mail-templates/for-company")
    public List<TemplateResponse> forCompany(@RequestParam UUID companyId) {
        return service.listForCompany(companyId);
    }

    public record SendRequest(String code) {}

    @PostMapping("/leads/{leadId}/send-mail")
    public MailTemplateService.RenderedMail send(@PathVariable UUID leadId, @RequestBody SendRequest body) {
        return service.sendToLead(leadId, body.code());
    }
}
