package software.magizhchi.crm.lead.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.lead.LeadService;
import software.magizhchi.crm.lead.domain.LeadStatus;
import software.magizhchi.crm.lead.web.dto.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    public List<LeadResponse> list(
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) UUID assignedMemberId,
            @RequestParam(required = false) String q) {
        return leadService.list(status, assignedMemberId, q);
    }

    @GetMapping("/stats")
    public LeadStatsResponse stats() {
        return leadService.stats();
    }

    @GetMapping("/stats/by-member")
    public List<MemberLeadStats> statsByMember() {
        return leadService.statsByMember();
    }

    @GetMapping("/assignable-members")
    public List<AssignableMember> assignableMembers() {
        return leadService.assignableMembers();
    }

    @GetMapping("/{id}")
    public LeadDetailResponse get(@PathVariable UUID id) {
        return leadService.get(id);
    }

    @PostMapping
    public LeadResponse create(@Valid @RequestBody CreateLeadRequest request) {
        return leadService.create(request);
    }

    @PatchMapping("/{id}")
    public LeadResponse update(@PathVariable UUID id,
                              @Valid @RequestBody UpdateLeadRequest request) {
        return leadService.update(id, request.name(), request.phone(), request.email());
    }

    public record RemapResponse(int updated) {}

    @PostMapping("/remap")
    public RemapResponse remap(@RequestBody RemapRequest request) {
        return new RemapResponse(leadService.remap(request));
    }

    @PatchMapping("/{id}/status")
    public LeadResponse updateStatus(@PathVariable UUID id,
                                     @Valid @RequestBody UpdateStatusRequest request) {
        return leadService.updateStatus(id, request.status());
    }

    @PatchMapping("/{id}/assign")
    public LeadResponse assign(@PathVariable UUID id,
                               @RequestBody AssignRequest request) {
        return leadService.assign(id, request);
    }

    @PostMapping("/{id}/notes")
    public LeadEventResponse addNote(@PathVariable UUID id,
                                     @Valid @RequestBody AddNoteRequest request) {
        return leadService.addNote(id, request.note());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        leadService.delete(id);
    }
}
