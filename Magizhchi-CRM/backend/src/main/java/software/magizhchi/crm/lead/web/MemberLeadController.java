package software.magizhchi.crm.lead.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.lead.MemberLeadService;
import software.magizhchi.crm.lead.domain.LeadStatus;
import software.magizhchi.crm.lead.web.dto.*;

import java.util.List;
import java.util.UUID;

/** Member-facing lead endpoints. Hard-isolated to the member's assigned leads. */
@RestController
@RequestMapping("/api/v1/my/leads")
public class MemberLeadController {

    private final MemberLeadService service;

    public MemberLeadController(MemberLeadService service) {
        this.service = service;
    }

    @GetMapping
    public List<MemberLeadResponse> list(
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) String q) {
        return service.list(status, q);
    }

    @GetMapping("/stats")
    public LeadStatsResponse stats() {
        return service.stats();
    }

    /** Whether this member can assign leads (manager) in any company. */
    @GetMapping("/can-assign")
    public CanAssignInfo canAssign() {
        return new CanAssignInfo(service.canAssignAnywhere());
    }
    public record CanAssignInfo(boolean canAssign) {}

    /** Members this manager can assign to, within one of their managed companies. */
    @GetMapping("/assignable-members")
    public List<AssignableMember> assignableMembers(@RequestParam UUID companyId) {
        return service.assignableMembers(companyId);
    }

    public record AssignReq(UUID memberAccountId) {}

    @PatchMapping("/{id}/assign")
    public MemberLeadResponse assign(@PathVariable UUID id, @RequestBody AssignReq body) {
        return service.assign(id, body.memberAccountId());
    }

    @GetMapping("/{id}")
    public LeadDetailResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PatchMapping("/{id}/status")
    public MemberLeadResponse updateStatus(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(id, request.status());
    }

    @PostMapping("/{id}/notes")
    public LeadEventResponse addNote(@PathVariable UUID id,
                                     @Valid @RequestBody AddNoteRequest request) {
        return service.addNote(id, request.note());
    }

    public record CallRequest(String note) {}

    @PostMapping("/{id}/call")
    public LeadEventResponse logCall(@PathVariable UUID id, @RequestBody(required = false) CallRequest body) {
        return service.logCall(id, body == null ? null : body.note());
    }
}
