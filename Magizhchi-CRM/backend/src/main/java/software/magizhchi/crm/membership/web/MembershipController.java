package software.magizhchi.crm.membership.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.membership.MembershipService;
import software.magizhchi.crm.membership.web.dto.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MembershipController {

    private final MembershipService service;

    public MembershipController(MembershipService service) {
        this.service = service;
    }

    // ---- Company: members ----

    @GetMapping("/members")
    public List<MemberRow> listMembers() {
        return service.listMembers();
    }

    @PostMapping("/members/invite")
    public MemberRow invite(@Valid @RequestBody InviteRequest request) {
        return service.invite(request);
    }

    public record DesignationAssign(UUID designationId) {}

    @PatchMapping("/members/{membershipId}/designation")
    public MemberRow setDesignation(@PathVariable UUID membershipId,
                                    @RequestBody DesignationAssign body) {
        return service.setDesignation(membershipId, body.designationId());
    }

    public record CanAssignRequest(boolean canAssign) {}

    @PatchMapping("/members/{membershipId}/can-assign")
    public MemberRow setCanAssign(@PathVariable UUID membershipId,
                                  @RequestBody CanAssignRequest body) {
        return service.setCanAssign(membershipId, body.canAssign());
    }

    @DeleteMapping("/members/{membershipId}")
    public void remove(@PathVariable UUID membershipId) {
        service.remove(membershipId);
    }

    // ---- Company: designations ----

    @GetMapping("/designations")
    public List<DesignationDto> listDesignations() {
        return service.listDesignations();
    }

    public record DesignationCreate(@NotBlank String name) {}

    @PostMapping("/designations")
    public DesignationDto addDesignation(@Valid @RequestBody DesignationCreate body) {
        return service.addDesignation(body.name());
    }

    @DeleteMapping("/designations/{id}")
    public void deleteDesignation(@PathVariable UUID id) {
        service.deleteDesignation(id);
    }

    // ---- Member: invites & companies ----

    @GetMapping("/my/invites")
    public List<InviteRow> myInvites() {
        return service.myInvites();
    }

    @GetMapping("/my/companies")
    public List<InviteRow> myCompanies() {
        return service.myCompanies();
    }

    @PostMapping("/my/invites/{membershipId}/accept")
    public InviteRow accept(@PathVariable UUID membershipId) {
        return service.accept(membershipId);
    }

    @PostMapping("/my/invites/{membershipId}/decline")
    public void decline(@PathVariable UUID membershipId) {
        service.decline(membershipId);
    }
}
