package software.magizhchi.crm.lead;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.magizhchi.crm.assignment.AssignmentRuleRepository;
import software.magizhchi.crm.assignment.domain.AssignmentRule;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.lead.domain.*;
import software.magizhchi.crm.lead.web.dto.*;
import software.magizhchi.crm.leadform.LeadFormFieldRepository;
import software.magizhchi.crm.leadform.domain.LeadFormField;
import software.magizhchi.crm.member.MemberProfileRepository;
import software.magizhchi.crm.member.domain.MemberProfile;
import software.magizhchi.crm.membership.MembershipRepository;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.*;

@Service
public class LeadService {

    private final LeadRepository leads;
    private final LeadEventRepository events;
    private final MembershipRepository memberships;
    private final MemberProfileRepository memberProfiles;
    private final AssignmentRuleRepository assignmentRules;
    private final LeadFormFieldRepository formFields;

    public LeadService(LeadRepository leads,
                       LeadEventRepository events,
                       MembershipRepository memberships,
                       MemberProfileRepository memberProfiles,
                       AssignmentRuleRepository assignmentRules,
                       LeadFormFieldRepository formFields) {
        this.leads = leads;
        this.events = events;
        this.memberships = memberships;
        this.memberProfiles = memberProfiles;
        this.assignmentRules = assignmentRules;
        this.formFields = formFields;
    }

    /** Resolve the current company; only COMPANY accounts manage leads here. */
    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) {
            throw ApiException.forbidden("Only company accounts can manage leads.");
        }
        return cid;
    }

    // ---- Queries ----------------------------------------------------------

    @Transactional(readOnly = true)
    public List<LeadResponse> list(LeadStatus status, UUID assignedMemberId, String q) {
        UUID cid = companyId();
        List<Lead> found = leads.search(cid, status, assignedMemberId,
                StringUtils.hasText(q) ? q.trim() : null);
        Set<UUID> assigneeIds = new HashSet<>();
        for (Lead l : found) {
            if (l.getAssignedMemberId() != null) assigneeIds.add(l.getAssignedMemberId());
        }
        Map<UUID, String> names = memberNames(assigneeIds);
        List<LeadResponse> out = new ArrayList<>(found.size());
        for (Lead l : found) {
            out.add(LeadResponse.from(l, names.get(l.getAssignedMemberId())));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public LeadStatsResponse stats() {
        UUID cid = companyId();
        Map<LeadStatus, Long> counts = new EnumMap<>(LeadStatus.class);
        for (Object[] row : leads.countByStatus(cid)) {
            counts.put((LeadStatus) row[0], (Long) row[1]);
        }
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return new LeadStatsResponse(
                total,
                counts.getOrDefault(LeadStatus.NEW, 0L),
                counts.getOrDefault(LeadStatus.ASSIGNED, 0L),
                counts.getOrDefault(LeadStatus.FOLLOW_UP, 0L),
                counts.getOrDefault(LeadStatus.WON, 0L),
                counts.getOrDefault(LeadStatus.LOST, 0L));
    }

    /** Per-member lead breakdown (one row per accepted member, incl. zeros). */
    @Transactional(readOnly = true)
    public List<MemberLeadStats> statsByMember() {
        UUID cid = companyId();
        List<AssignableMember> members = memberships.findAssignable(cid);

        Map<UUID, EnumMap<LeadStatus, Long>> byMember = new HashMap<>();
        for (Object[] row : leads.countByAssigneeAndStatus(cid)) {
            UUID mid = (UUID) row[0];
            LeadStatus st = (LeadStatus) row[1];
            long c = (Long) row[2];
            byMember.computeIfAbsent(mid, k -> new EnumMap<>(LeadStatus.class)).put(st, c);
        }

        List<MemberLeadStats> out = new ArrayList<>();
        for (AssignableMember m : members) {
            EnumMap<LeadStatus, Long> c = byMember.getOrDefault(m.accountId(), new EnumMap<>(LeadStatus.class));
            long isNew = c.getOrDefault(LeadStatus.NEW, 0L);
            long assigned = c.getOrDefault(LeadStatus.ASSIGNED, 0L);
            long followUp = c.getOrDefault(LeadStatus.FOLLOW_UP, 0L);
            long won = c.getOrDefault(LeadStatus.WON, 0L);
            long lost = c.getOrDefault(LeadStatus.LOST, 0L);
            out.add(new MemberLeadStats(
                    m.accountId(), m.displayName(), m.email(),
                    isNew + assigned + followUp + won + lost,
                    isNew, assigned, followUp, won, lost));
        }
        out.sort((a, b) -> Long.compare(b.total(), a.total()));
        return out;
    }

    @Transactional(readOnly = true)
    public LeadDetailResponse get(UUID id) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        Map<UUID, String> names = memberNames(
                lead.getAssignedMemberId() == null ? Set.of() : Set.of(lead.getAssignedMemberId()));
        List<LeadEvent> timeline = events.findByLeadIdOrderByCreatedAtDesc(id);
        List<LeadEventResponse> tl = new ArrayList<>(timeline.size());
        for (LeadEvent e : timeline) {
            tl.add(LeadEventResponse.from(e, null));
        }
        return new LeadDetailResponse(
                LeadResponse.from(lead, names.get(lead.getAssignedMemberId())), tl);
    }

    @Transactional(readOnly = true)
    public List<AssignableMember> assignableMembers() {
        return memberships.findAssignable(companyId());
    }

    // ---- Mutations --------------------------------------------------------

    @Transactional
    public LeadResponse create(CreateLeadRequest req) {
        UUID cid = companyId();

        String name = trim(req.name());
        String phone = trim(req.phone());
        String email = trim(req.email());
        Map<String, Object> custom = new HashMap<>();

        // Form-builder mode: map each submitted field by its configured role and
        // keep every field in customFields. Also enforces required fields.
        if (req.fields() != null && !req.fields().isEmpty()) {
            List<LeadFormField> form = formFields.findByCompanyIdOrderBySortOrderAsc(cid);
            for (LeadFormField f : form) {
                Object raw = req.fields().get(f.getFieldKey());
                String val = raw == null ? null : trim(String.valueOf(raw));
                if (f.isRequired() && val == null) {
                    throw ApiException.badRequest(f.getLabel() + " is required.");
                }
                if (val == null) continue;
                custom.put(f.getFieldKey(), val);
                switch (f.getRole()) {
                    case "NAME" -> { if (name == null) name = val; }
                    case "PHONE" -> { if (phone == null) phone = val; }
                    case "EMAIL" -> { if (email == null) email = val; }
                    default -> { /* NONE: kept in customFields only */ }
                }
            }
            // also keep any submitted keys not in the form definition
            req.fields().forEach((k, v) -> {
                if (v != null && !custom.containsKey(k) && !String.valueOf(v).isBlank()) {
                    custom.put(k, String.valueOf(v).trim());
                }
            });
        }

        if (name == null && phone == null && email == null && custom.isEmpty()) {
            throw ApiException.badRequest("Provide at least a name, phone, or email.");
        }

        Lead lead = leads.save(Lead.builder()
                .companyId(cid)
                .productId(req.productId())
                .source(LeadSource.MANUAL)
                .name(name)
                .phone(phone)
                .email(email)
                .customFields(custom)
                .status(LeadStatus.NEW)
                .build());

        // Auto-assign on intake per the company's routing rules (if Automatic).
        UUID auto = resolveAutoAssignee(cid, lead);
        if (auto != null) {
            applyAssignment(lead, auto, cid);
        }
        String mname = lead.getAssignedMemberId() == null ? null
                : memberNames(Set.of(lead.getAssignedMemberId())).get(lead.getAssignedMemberId());
        return LeadResponse.from(lead, mname);
    }

    /**
     * Insert a lead from an ingestion channel (Excel / API / webhook). Runs with
     * an explicit companyId rather than the JWT TenantContext, so it is safe to
     * call from public (unauthenticated) endpoints. Applies the company's
     * auto-assignment policy on intake. Returns false if there is nothing to save.
     */
    public boolean ingest(UUID companyId, LeadSource source, String name, String phone, String email) {
        return ingest(companyId, source, name, phone, email, null, true);
    }

    public boolean ingest(UUID companyId, LeadSource source, String name, String phone, String email,
                          Map<String, Object> allFields) {
        return ingest(companyId, source, name, phone, email, allFields, true);
    }

    /**
     * Insert a lead from an ingestion channel (Excel / API / webhook). Runs with
     * an explicit companyId rather than the JWT TenantContext, so it is safe to
     * call from public (unauthenticated) endpoints. Stores ALL original columns in
     * customFields. Applies the company's auto-assignment policy on intake.
     * Returns false if there is nothing to save, or (when dedupe) it is a duplicate.
     */
    @Transactional
    public boolean ingest(UUID companyId, LeadSource source, String name, String phone, String email,
                          Map<String, Object> allFields, boolean dedupe) {
        String n = trim(name), p = trim(phone), e = trim(email);
        // Keep the row even if the three "known" fields are blank but other columns exist.
        boolean hasAnyField = allFields != null && allFields.values().stream()
                .anyMatch(v -> v != null && !String.valueOf(v).isBlank());
        if (n == null && p == null && e == null && !hasAnyField) {
            return false;
        }
        // De-duplicate: skip if a lead with the same phone or email already exists
        // for this company. Prevents double-imports (e.g. clicking Import twice).
        if (dedupe) {
            boolean dup = (p != null && leads.countByCompanyIdAndPhone(companyId, p) > 0)
                    || (e != null && leads.countByCompanyIdAndEmailIgnoreCase(companyId, e) > 0);
            if (dup) return false;
        }
        Map<String, Object> custom = new java.util.LinkedHashMap<>();
        if (allFields != null) {
            allFields.forEach((k, v) -> {
                if (k != null && v != null && !String.valueOf(v).isBlank()) {
                    custom.put(k, v);
                }
            });
        }
        Lead lead = leads.save(Lead.builder()
                .companyId(companyId)
                .source(source)
                .name(n)
                .phone(p)
                .email(e)
                .customFields(custom)
                .status(LeadStatus.NEW)
                .build());
        UUID auto = resolveAutoAssignee(companyId, lead);
        if (auto != null) {
            applyAssignment(lead, auto, companyId);
        }
        return true;
    }

    /** Edit a single lead's core fields. Null = unchanged; blank = clear. */
    @Transactional
    public LeadResponse update(UUID id, String name, String phone, String email) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        if (name != null) lead.setName(blankToNull(name));
        if (phone != null) lead.setPhone(blankToNull(phone));
        if (email != null) lead.setEmail(blankToNull(email));
        leads.save(lead);
        String mname = lead.getAssignedMemberId() == null ? null
                : memberNames(Set.of(lead.getAssignedMemberId())).get(lead.getAssignedMemberId());
        return LeadResponse.from(lead, mname);
    }

    /**
     * Bulk re-map: for every (optionally source-filtered) lead in the company,
     * re-derive name/phone/email from values already stored in customFields.
     * Returns the number of leads updated.
     */
    @Transactional
    public int remap(software.magizhchi.crm.lead.web.dto.RemapRequest req) {
        UUID cid = companyId();
        List<Lead> all = leads.search(cid, null, null, null);
        int updated = 0;
        for (Lead lead : all) {
            if (req.onlySource() != null && !req.onlySource().isBlank()
                    && !lead.getSource().name().equalsIgnoreCase(req.onlySource())) {
                continue;
            }
            Map<String, Object> cf = lead.getCustomFields();
            if (cf == null || cf.isEmpty()) continue;
            boolean changed = false;

            if (req.nameColumn() != null && !req.nameColumn().isBlank()) {
                String v = cfValue(cf, req.nameColumn());
                if (v != null) { lead.setName(v); changed = true; }
            }
            if (req.phoneColumns() != null && !req.phoneColumns().isEmpty()) {
                for (String col : req.phoneColumns()) {
                    String v = cfValue(cf, col);
                    if (v != null) { lead.setPhone(v); changed = true; break; }
                }
            }
            if (req.emailColumn() != null && !req.emailColumn().isBlank()) {
                String v = cfValue(cf, req.emailColumn());
                if (v != null) { lead.setEmail(v); changed = true; }
            }
            if (changed) { leads.save(lead); updated++; }
        }
        return updated;
    }

    private static String cfValue(Map<String, Object> cf, String key) {
        Object v = cf.get(key);
        if (v == null) {
            String want = key.toLowerCase().replaceAll("[\\s_\\-]", "");
            for (Map.Entry<String, Object> e : cf.entrySet()) {
                if (e.getKey().toLowerCase().replaceAll("[\\s_\\-]", "").equals(want)) { v = e.getValue(); break; }
            }
        }
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Transactional
    public LeadResponse updateStatus(UUID id, LeadStatus newStatus) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        LeadStatus old = lead.getStatus();
        if (old != newStatus) {
            lead.setStatus(newStatus);
            leads.save(lead);
            event(lead, LeadEventType.STATUS_CHANGE, Map.of(
                    "from", old.name(), "to", newStatus.name()));
        }
        String name = lead.getAssignedMemberId() == null ? null
                : memberNames(Set.of(lead.getAssignedMemberId())).get(lead.getAssignedMemberId());
        return LeadResponse.from(lead, name);
    }

    @Transactional
    public LeadResponse assign(UUID id, AssignRequest req) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));

        UUID target;
        if (req.auto()) {
            target = pickLeastLoaded(cid);
            if (target == null) {
                throw ApiException.badRequest("No accepted members available to auto-assign.");
            }
        } else {
            if (req.memberAccountId() == null) {
                throw ApiException.badRequest("memberAccountId is required for manual assignment.");
            }
            boolean ok = memberships.existsByCompanyIdAndMemberAccountIdAndStatus(
                    cid, req.memberAccountId(),
                    software.magizhchi.crm.membership.domain.MembershipStatus.ACCEPTED);
            if (!ok) {
                throw ApiException.badRequest("That member is not an accepted member of this company.");
            }
            target = req.memberAccountId();
        }

        applyAssignment(lead, target, cid);
        String name = memberNames(Set.of(target)).get(target);
        return LeadResponse.from(lead, name);
    }

    @Transactional
    public LeadEventResponse addNote(UUID id, String note) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        LeadEvent e = event(lead, LeadEventType.NOTE, Map.of("note", note));
        return LeadEventResponse.from(e, null);
    }

    @Transactional
    public void delete(UUID id) {
        UUID cid = companyId();
        Lead lead = leads.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> ApiException.notFound("Lead not found."));
        leads.delete(lead);
    }

    // ---- Helpers ----------------------------------------------------------

    private void applyAssignment(Lead lead, UUID memberAccountId, UUID cid) {
        lead.setAssignedMemberId(memberAccountId);
        if (lead.getStatus() == LeadStatus.NEW) {
            lead.setStatus(LeadStatus.ASSIGNED);
        }
        leads.save(lead);
        String name = memberNames(Set.of(memberAccountId)).get(memberAccountId);
        event(lead, LeadEventType.ASSIGNMENT, Map.of(
                "memberAccountId", memberAccountId.toString(),
                "memberName", name == null ? "" : name));
    }

    private LeadEvent event(Lead lead, LeadEventType type, Map<String, Object> payload) {
        return events.save(LeadEvent.builder()
                .companyId(lead.getCompanyId())
                .leadId(lead.getId())
                .type(type)
                .payload(new HashMap<>(payload))
                .actorAccountId(TenantContext.accountId())
                .build());
    }

    private UUID pickLeastLoaded(UUID cid) {
        List<UUID> accepted = memberships.findAcceptedMemberIds(cid);
        if (accepted.isEmpty()) return null;
        Map<UUID, Long> load = new HashMap<>();
        accepted.forEach(m -> load.put(m, 0L));
        for (Object[] row : leads.countByAssignee(cid)) {
            UUID mid = (UUID) row[0];
            if (load.containsKey(mid)) load.put(mid, (Long) row[1]);
        }
        return load.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(accepted.get(0));
    }

    private String currentMode(UUID cid) {
        return assignmentRules.findByCompanyIdAndProductIdIsNull(cid)
                .map(AssignmentRule::getMode)
                .orElse("MANUAL");
    }

    /**
     * Decide who a freshly-arrived lead goes to when Automatic (LOAD_BALANCED) is on:
     * evaluate field-based routes in order (first match wins) reading name/phone/email
     * or any custom field; otherwise apply the fallback (least-loaded, or unassigned).
     * Returns null = leave unassigned / no auto-assignment.
     */
    @SuppressWarnings("unchecked")
    private UUID resolveAutoAssignee(UUID cid, Lead lead) {
        AssignmentRule rule = assignmentRules.findByCompanyIdAndProductIdIsNull(cid).orElse(null);
        if (rule == null || !"LOAD_BALANCED".equals(rule.getMode())) {
            return null; // Manual / no rule → no auto-assign
        }
        Set<UUID> accepted = new HashSet<>(memberships.findAcceptedMemberIds(cid));
        if (accepted.isEmpty()) return null;

        String fallback = "LEAST_LOADED";
        UUID fallbackMemberId = null;
        Map<String, Object> cfg = rule.getConfig();
        if (cfg != null) {
            Object fb = cfg.get("fallback");
            if (fb != null) fallback = String.valueOf(fb);
            fallbackMemberId = parseUuid(cfg.get("fallbackMemberId"));
            Object raw = cfg.get("routes");
            if (raw instanceof List<?> list) {
                for (Object o : list) {
                    if (!(o instanceof Map<?, ?> m)) continue;
                    UUID mid = parseUuid(m.get("memberAccountId"));
                    if (mid == null || !accepted.contains(mid)) continue; // skip removed members
                    String leadVal = leadFieldValue(lead, strOrNull(m.get("field")));
                    if (matchesRoute(leadVal, strOrNull(m.get("op")), strOrNull(m.get("value")))) {
                        return mid; // first matching route wins
                    }
                }
            }
        }
        // No route matched → apply fallback
        if ("UNASSIGNED".equals(fallback)) return null;
        if ("MEMBER".equals(fallback)) {
            return (fallbackMemberId != null && accepted.contains(fallbackMemberId))
                    ? fallbackMemberId : null; // assign-all target (skip if removed)
        }
        return pickLeastLoaded(cid);
    }

    /** Read a lead field by key: name/phone/email or any custom field (area/age/etc.). */
    private String leadFieldValue(Lead lead, String field) {
        if (field == null) return null;
        String f = field.toLowerCase().replaceAll("[\\s_\\-]", "");
        switch (f) {
            case "name", "fullname" -> { return lead.getName(); }
            case "phone", "mobile", "phonenumber" -> { return lead.getPhone(); }
            case "email" -> { return lead.getEmail(); }
            default -> { return cfValue(lead.getCustomFields(), field); }
        }
    }

    private boolean matchesRoute(String leadVal, String op, String ruleVal) {
        if (leadVal == null) return false;
        String a = leadVal.trim();
        String b = ruleVal == null ? "" : ruleVal.trim();
        String opn = op == null ? "equals" : op;
        switch (opn) {
            case "equals":   return a.equalsIgnoreCase(b);
            case "contains": return a.toLowerCase().contains(b.toLowerCase());
            case "in":
                for (String part : b.split(",")) if (a.equalsIgnoreCase(part.trim())) return true;
                return false;
            case "gte": { Double x = num(a), y = num(b); return x != null && y != null && x >= y; }
            case "lte": { Double x = num(a), y = num(b); return x != null && y != null && x <= y; }
            default: return false;
        }
    }

    private static Double num(String s) {
        try { return Double.parseDouble(s.replaceAll("[^0-9.\\-]", "")); }
        catch (Exception e) { return null; }
    }

    private static String strOrNull(Object o) { return o == null ? null : String.valueOf(o); }

    private static UUID parseUuid(Object o) {
        if (o == null) return null;
        try { return UUID.fromString(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    /**
     * Null-tolerant name lookup. Callers do {@code names.get(assignedMemberId)}
     * where the id can be null (unassigned lead); an immutable Map.of() throws
     * NPE on get(null), so we always return a HashMap.
     */
    private Map<UUID, String> memberNames(Set<UUID> accountIds) {
        Map<UUID, String> names = new HashMap<>();
        if (accountIds == null || accountIds.isEmpty()) return names;
        for (MemberProfile p : memberProfiles.findByAccountIdIn(accountIds)) {
            names.put(p.getAccountId(), p.getDisplayName());
        }
        return names;
    }

    private static String trim(String s) {
        return s == null ? null : (s.isBlank() ? null : s.trim());
    }
}
