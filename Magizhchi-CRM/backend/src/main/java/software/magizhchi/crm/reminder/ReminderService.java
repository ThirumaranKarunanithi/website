package software.magizhchi.crm.reminder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.magizhchi.crm.auth.domain.AccountType;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.lead.LeadEventRepository;
import software.magizhchi.crm.lead.LeadRepository;
import software.magizhchi.crm.lead.domain.Lead;
import software.magizhchi.crm.lead.domain.LeadEvent;
import software.magizhchi.crm.lead.domain.LeadEventType;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.membership.MembershipRepository;
import software.magizhchi.crm.reminder.domain.Reminder;
import software.magizhchi.crm.reminder.domain.ReminderStatus;
import software.magizhchi.crm.reminder.web.dto.CreateReminderRequest;
import software.magizhchi.crm.reminder.web.dto.ReminderRow;
import software.magizhchi.crm.tenancy.TenantContext;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReminderService {

    private final ReminderRepository reminders;
    private final LeadRepository leads;
    private final LeadEventRepository events;
    private final MemberProfileRepository profiles;
    private final MembershipRepository memberships;

    public ReminderService(ReminderRepository reminders,
                           LeadRepository leads,
                           LeadEventRepository events,
                           MemberProfileRepository profiles,
                           MembershipRepository memberships) {
        this.reminders = reminders;
        this.leads = leads;
        this.events = events;
        this.profiles = profiles;
        this.memberships = memberships;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can do this here.");
        return cid;
    }

    /** Create a reminder on a lead (company side). Logged to the lead timeline. */
    @Transactional
    public ReminderRow create(UUID leadId, CreateReminderRequest req) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(leadId, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        // For-whom: the assigned member if any, else the creating account.
        UUID forMember = lead.getAssignedMemberId() != null
                ? lead.getAssignedMemberId() : TenantContext.accountId();

        Reminder r = reminders.save(Reminder.builder()
                .companyId(cid)
                .leadId(leadId)
                .memberAccountId(forMember)
                .remindAt(req.remindAt())
                .note(req.note())
                .status(ReminderStatus.PENDING)
                .build());

        // Timeline entry on the lead.
        Map<String, Object> payload = new HashMap<>();
        payload.put("remindAt", req.remindAt().toString());
        if (req.note() != null) payload.put("note", req.note());
        events.save(LeadEvent.builder()
                .companyId(cid)
                .leadId(leadId)
                .type(LeadEventType.REMINDER)
                .payload(payload)
                .actorAccountId(TenantContext.accountId())
                .build());

        return toRow(r, lead, names(Set.of(forMember)));
    }

    /** Company follow-ups, optionally filtered by status (PENDING/DONE/CANCELLED). */
    @Transactional(readOnly = true)
    public List<ReminderRow> listForCompany(String status) {
        UUID cid = companyId();
        List<Reminder> rows = status == null || status.isBlank()
                ? reminders.findByCompanyIdOrderByRemindAtAsc(cid)
                : reminders.findByCompanyIdAndStatusOrderByRemindAtAsc(cid, parse(status));
        return assemble(rows);
    }

    /** A member's own follow-ups (member side). */
    @Transactional(readOnly = true)
    public List<ReminderRow> listForMember() {
        var p = TenantContext.get();
        if (p == null || p.accountType() != AccountType.MEMBER) {
            throw ApiException.forbidden("Only members can view their reminders here.");
        }
        List<Reminder> rows = reminders.findByMemberAccountIdAndStatusOrderByRemindAtAsc(
                p.accountId(), ReminderStatus.PENDING);
        // HARD ISOLATION: only reminders from companies where the member is still
        // ACCEPTED. Once removed from a company, its reminders vanish immediately.
        Set<UUID> activeCompanies = new HashSet<>(memberships.findActiveCompanyIds(p.accountId()));
        rows = rows.stream().filter(r -> activeCompanies.contains(r.getCompanyId())).toList();
        return assemble(rows);
    }

    @Transactional
    public ReminderRow markDone(UUID id) {
        Reminder r = owned(id);
        r.setStatus(ReminderStatus.DONE);
        reminders.save(r);
        Lead lead = leads.findById(r.getLeadId()).orElse(null);
        return toRow(r, lead, names(Set.of(r.getMemberAccountId())));
    }

    @Transactional
    public void delete(UUID id) {
        reminders.delete(owned(id));
    }

    // ---- helpers ----

    private Reminder owned(UUID id) {
        Reminder r = reminders.findById(id)
                .orElseThrow(() -> ApiException.notFound("Reminder not found."));
        UUID cid = TenantContext.companyId();
        var p = TenantContext.get();
        boolean ok = (cid != null && r.getCompanyId().equals(cid))
                || (p != null && p.accountType() == AccountType.MEMBER && r.getMemberAccountId().equals(p.accountId()));
        if (!ok) throw ApiException.notFound("Reminder not found.");
        return r;
    }

    private List<ReminderRow> assemble(List<Reminder> rows) {
        if (rows.isEmpty()) return List.of();
        Set<UUID> leadIds = rows.stream().map(Reminder::getLeadId).collect(Collectors.toSet());
        Set<UUID> memberIds = rows.stream().map(Reminder::getMemberAccountId).collect(Collectors.toSet());
        Map<UUID, Lead> leadById = leads.findAllById(leadIds).stream()
                .collect(Collectors.toMap(Lead::getId, l -> l));
        Map<UUID, String> nameById = names(memberIds);
        List<ReminderRow> out = new ArrayList<>(rows.size());
        for (Reminder r : rows) out.add(toRow(r, leadById.get(r.getLeadId()), nameById));
        return out;
    }

    private Map<UUID, String> names(Set<UUID> ids) {
        Map<UUID, String> m = new HashMap<>();
        if (ids == null || ids.isEmpty()) return m;
        for (MemberProfile p : profiles.findByAccountIdIn(ids)) m.put(p.getAccountId(), p.getDisplayName());
        return m;
    }

    private ReminderRow toRow(Reminder r, Lead lead, Map<UUID, String> names) {
        boolean overdue = r.getStatus() == ReminderStatus.PENDING
                && r.getRemindAt().isBefore(Instant.now());
        return new ReminderRow(
                r.getId(),
                r.getLeadId(),
                lead != null ? lead.getName() : null,
                lead != null ? lead.getPhone() : null,
                r.getMemberAccountId(),
                names.get(r.getMemberAccountId()),
                r.getRemindAt(),
                r.getNote(),
                r.getStatus().name(),
                overdue);
    }

    private ReminderStatus parse(String s) {
        try { return ReminderStatus.valueOf(s.toUpperCase()); }
        catch (Exception e) { throw ApiException.badRequest("Invalid status: " + s); }
    }
}
