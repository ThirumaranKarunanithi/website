package software.magizhchi.crm.lead;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.magizhchi.crm.auth.domain.AccountType;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.company.CompanyRepository;
import software.magizhchi.crm.company.domain.Company;
import software.magizhchi.crm.lead.domain.*;
import software.magizhchi.crm.lead.web.dto.*;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.membership.MembershipRepository;
import software.magizhchi.crm.membership.domain.MembershipStatus;
import software.magizhchi.crm.settings.VisibilityService;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Member-facing lead operations. HARD ISOLATION: a member only sees/acts on leads
 * within companies where they are still ACCEPTED. By default that's leads assigned
 * to them; if they have canAssign (manager) in a company, they see ALL that
 * company's leads and may (re)assign them. Field visibility hides company-hidden
 * columns from members.
 */
@Service
public class MemberLeadService {

    private final LeadRepository leads;
    private final LeadEventRepository events;
    private final MembershipRepository memberships;
    private final CompanyRepository companies;
    private final MemberProfileRepository profiles;
    private final VisibilityService visibility;

    public MemberLeadService(LeadRepository leads,
                             LeadEventRepository events,
                             MembershipRepository memberships,
                             CompanyRepository companies,
                             MemberProfileRepository profiles,
                             VisibilityService visibility) {
        this.leads = leads;
        this.events = events;
        this.memberships = memberships;
        this.companies = companies;
        this.profiles = profiles;
        this.visibility = visibility;
    }

    private UUID memberId() {
        var p = TenantContext.get();
        if (p == null || p.accountType() != AccountType.MEMBER) {
            throw ApiException.forbidden("Only member accounts can access this.");
        }
        return p.accountId();
    }

    private List<UUID> activeCompanyIds(UUID mid) {
        return memberships.findActiveCompanyIds(mid);
    }

    private Set<UUID> managerCompanyIds(UUID mid) {
        return new HashSet<>(memberships.findManagerCompanyIds(mid));
    }

    /** True if this member can assign leads in at least one company. */
    @Transactional(readOnly = true)
    public boolean canAssignAnywhere() {
        return !memberships.findManagerCompanyIds(memberId()).isEmpty();
    }

    @Transactional(readOnly = true)
    public List<MemberLeadResponse> list(LeadStatus status, String q) {
        UUID mid = memberId();
        List<UUID> active = activeCompanyIds(mid);
        if (active.isEmpty()) return List.of();
        Set<UUID> manager = managerCompanyIds(mid);

        // Manager companies: all their leads. Non-manager companies: only mine.
        // Simplest correct approach: fetch all leads in active companies, then filter.
        List<Lead> found = leads.searchInCompanies(active, status,
                StringUtils.hasText(q) ? q.trim() : null);
        found = found.stream()
                .filter(l -> manager.contains(l.getCompanyId()) || mid.equals(l.getAssignedMemberId()))
                .toList();

        Map<UUID, String> companyNames = companyNames(found);
        Set<String> hidden = hiddenAcross(active);
        return found.stream()
                .map(l -> applyVisibility(MemberLeadResponse.from(l, companyNames.get(l.getCompanyId())), hidden))
                .toList();
    }

    @Transactional(readOnly = true)
    public LeadStatsResponse stats() {
        // Stats reflect what the member can see (manager = company-wide; else own).
        List<MemberLeadResponse> visible = list(null, null);
        Map<String, Long> c = visible.stream()
                .collect(Collectors.groupingBy(MemberLeadResponse::status, Collectors.counting()));
        return new LeadStatsResponse(visible.size(),
                c.getOrDefault("NEW", 0L), c.getOrDefault("ASSIGNED", 0L),
                c.getOrDefault("FOLLOW_UP", 0L), c.getOrDefault("WON", 0L), c.getOrDefault("LOST", 0L));
    }

    @Transactional(readOnly = true)
    public List<AssignableMember> assignableMembers(UUID companyId) {
        UUID mid = memberId();
        if (!managerCompanyIds(mid).contains(companyId)) {
            throw ApiException.forbidden("You can't assign leads in this company.");
        }
        return memberships.findAssignable(companyId);
    }

    @Transactional(readOnly = true)
    public LeadDetailResponse get(UUID id) {
        Lead lead = viewable(id);
        Set<String> hidden = hiddenAcross(List.of(lead.getCompanyId()));
        List<LeadEvent> timeline = events.findByLeadIdOrderByCreatedAtDesc(id);
        List<LeadEventResponse> tl = new ArrayList<>(timeline.size());
        for (LeadEvent e : timeline) tl.add(LeadEventResponse.from(e, null));
        String companyName = companies.findById(lead.getCompanyId()).map(Company::getName).orElse(null);
        String assignedName = lead.getAssignedMemberId() == null ? null
                : profiles.findByAccountId(lead.getAssignedMemberId()).map(MemberProfile::getDisplayName).orElse(null);
        LeadResponse lr = applyVisibilityLR(new LeadResponse(
                lead.getId(), lead.getName(), lead.getPhone(), lead.getEmail(),
                lead.getStatus().name(), lead.getSource().name(),
                lead.getProductId(), lead.getAssignedMemberId(), assignedName,
                lead.getCustomFields(), lead.getCreatedAt(), lead.getUpdatedAt()), hidden);
        return new LeadDetailResponse(lr, tl);
    }

    @Transactional
    public MemberLeadResponse updateStatus(UUID id, LeadStatus newStatus) {
        Lead lead = actable(id);
        LeadStatus old = lead.getStatus();
        if (old != newStatus) {
            lead.setStatus(newStatus);
            leads.save(lead);
            event(lead, LeadEventType.STATUS_CHANGE, Map.of("from", old.name(), "to", newStatus.name()));
        }
        return MemberLeadResponse.from(lead, companyName(lead));
    }

    @Transactional
    public LeadEventResponse addNote(UUID id, String note) {
        Lead lead = actable(id);
        return LeadEventResponse.from(event(lead, LeadEventType.NOTE, Map.of("note", note)), null);
    }

    @Transactional
    public LeadEventResponse logCall(UUID id, String note) {
        Lead lead = actable(id);
        Map<String, Object> payload = new HashMap<>();
        if (note != null && !note.isBlank()) payload.put("note", note.trim());
        return LeadEventResponse.from(event(lead, LeadEventType.CALL, payload), null);
    }

    /** Manager-only: (re)assign a lead in a company where this member can assign. */
    @Transactional
    public MemberLeadResponse assign(UUID id, UUID toMemberId) {
        UUID mid = memberId();
        Set<UUID> manager = managerCompanyIds(mid);
        Lead lead = viewable(id);
        if (!manager.contains(lead.getCompanyId())) {
            throw ApiException.forbidden("You can't assign leads in this company.");
        }
        boolean ok = memberships.existsByCompanyIdAndMemberAccountIdAndStatus(
                lead.getCompanyId(), toMemberId, MembershipStatus.ACCEPTED);
        if (!ok) throw ApiException.badRequest("That person is not an active member of this company.");
        lead.setAssignedMemberId(toMemberId);
        if (lead.getStatus() == LeadStatus.NEW) lead.setStatus(LeadStatus.ASSIGNED);
        leads.save(lead);
        String name = profiles.findByAccountId(toMemberId).map(MemberProfile::getDisplayName).orElse("a member");
        event(lead, LeadEventType.ASSIGNMENT, Map.of("memberAccountId", toMemberId.toString(), "memberName", name));
        return MemberLeadResponse.from(lead, companyName(lead));
    }

    // ---- access helpers ----

    /** A lead the member may VIEW (manager: any company lead; else assigned to me). */
    private Lead viewable(UUID id) {
        UUID mid = memberId();
        List<UUID> active = activeCompanyIds(mid);
        if (active.isEmpty()) throw ApiException.notFound("Lead not found.");
        Lead lead = leads.findById(id)
                .filter(l -> active.contains(l.getCompanyId()))
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        Set<UUID> manager = managerCompanyIds(mid);
        if (manager.contains(lead.getCompanyId()) || mid.equals(lead.getAssignedMemberId())) return lead;
        throw ApiException.notFound("Lead not found.");
    }

    /** A lead the member may ACT on (same rule as view — managers act company-wide). */
    private Lead actable(UUID id) {
        return viewable(id);
    }

    // ---- visibility ----

    private Set<String> hiddenAcross(Collection<UUID> companyIds) {
        // Union of hidden keys across the relevant companies (normalized).
        Set<String> hidden = new HashSet<>();
        for (UUID cid : new HashSet<>(companyIds)) hidden.addAll(visibility.hiddenKeys(cid));
        return hidden;
    }

    private MemberLeadResponse applyVisibility(MemberLeadResponse r, Set<String> hidden) {
        if (hidden.isEmpty()) return r;
        Map<String, Object> cf = r.customFields() == null ? null : new LinkedHashMap<>(r.customFields());
        if (cf != null) cf.keySet().removeIf(k -> hidden.contains(VisibilityService.norm(k)));
        return new MemberLeadResponse(
                r.id(),
                hidden.contains("name") ? null : r.name(),
                hidden.contains("phone") ? null : r.phone(),
                hidden.contains("email") ? null : r.email(),
                r.status(), hidden.contains("source") ? null : r.source(),
                r.companyId(), r.companyName(), cf, r.createdAt(), r.updatedAt());
    }

    private LeadResponse applyVisibilityLR(LeadResponse r, Set<String> hidden) {
        if (hidden.isEmpty()) return r;
        Map<String, Object> cf = r.customFields() == null ? null : new LinkedHashMap<>(r.customFields());
        if (cf != null) cf.keySet().removeIf(k -> hidden.contains(VisibilityService.norm(k)));
        return new LeadResponse(
                r.id(),
                hidden.contains("name") ? null : r.name(),
                hidden.contains("phone") ? null : r.phone(),
                hidden.contains("email") ? null : r.email(),
                r.status(), hidden.contains("source") ? null : r.source(),
                r.productId(), r.assignedMemberId(), r.assignedMemberName(),
                cf, r.createdAt(), r.updatedAt());
    }

    // ---- misc ----

    private LeadEvent event(Lead lead, LeadEventType type, Map<String, Object> payload) {
        return events.save(LeadEvent.builder()
                .companyId(lead.getCompanyId())
                .leadId(lead.getId())
                .type(type)
                .payload(new HashMap<>(payload))
                .actorAccountId(TenantContext.accountId())
                .build());
    }

    private String companyName(Lead lead) {
        return companies.findById(lead.getCompanyId()).map(Company::getName).orElse(null);
    }

    private Map<UUID, String> companyNames(List<Lead> leadList) {
        Set<UUID> ids = leadList.stream().map(Lead::getCompanyId).collect(Collectors.toSet());
        Map<UUID, String> names = new HashMap<>();
        for (Company c : companies.findAllById(ids)) names.put(c.getId(), c.getName());
        return names;
    }
}
