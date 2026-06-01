package software.magizhchi.crm.assignment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.magizhchi.crm.assignment.domain.AssignmentRule;
import software.magizhchi.crm.assignment.web.dto.RoutingConfig;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.lead.web.dto.AssignableMember;
import software.magizhchi.crm.membership.MembershipRepository;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.*;

@Service
public class AssignmentSettingsService {

    private static final Set<String> ALLOWED_MODES = Set.of("MANUAL", "LOAD_BALANCED");
    private static final Set<String> ALLOWED_FALLBACKS = Set.of("LEAST_LOADED", "UNASSIGNED", "MEMBER");
    private static final Set<String> ALLOWED_OPS = Set.of("equals", "contains", "in", "gte", "lte");

    private final AssignmentRuleRepository rules;
    private final MembershipRepository memberships;

    public AssignmentSettingsService(AssignmentRuleRepository rules, MembershipRepository memberships) {
        this.rules = rules;
        this.memberships = memberships;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can change settings.");
        return cid;
    }

    @Transactional(readOnly = true)
    public String getMode() {
        return rules.findByCompanyIdAndProductIdIsNull(companyId())
                .map(AssignmentRule::getMode)
                .orElse("MANUAL");
    }

    @Transactional
    public String setMode(String mode) {
        UUID cid = companyId();
        if (mode == null || !ALLOWED_MODES.contains(mode)) {
            throw ApiException.badRequest("mode must be one of " + ALLOWED_MODES);
        }
        AssignmentRule rule = rules.findByCompanyIdAndProductIdIsNull(cid)
                .orElseGet(() -> AssignmentRule.builder().companyId(cid).build());
        rule.setMode(mode);
        rules.save(rule);
        return rule.getMode();
    }

    /** Full routing config (mode + fallback + routes), with member names resolved. */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public RoutingConfig getConfig() {
        UUID cid = companyId();
        AssignmentRule rule = rules.findByCompanyIdAndProductIdIsNull(cid).orElse(null);
        String mode = rule == null ? "MANUAL" : rule.getMode();
        Map<String, Object> cfg = rule == null || rule.getConfig() == null ? Map.of() : rule.getConfig();
        String fallback = String.valueOf(cfg.getOrDefault("fallback", "LEAST_LOADED"));
        UUID fallbackMemberId = parseId(cfg.get("fallbackMemberId"));

        Map<UUID, String> names = new HashMap<>();
        for (AssignableMember m : memberships.findAssignable(cid)) names.put(m.accountId(), m.displayName());

        List<RoutingConfig.Route> routes = new ArrayList<>();
        Object raw = cfg.get("routes");
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    UUID mid = parseId(m.get("memberAccountId"));
                    routes.add(new RoutingConfig.Route(
                            str(m.get("field")), str(m.get("op")), str(m.get("value")),
                            mid, mid == null ? null : names.get(mid)));
                }
            }
        }
        return new RoutingConfig(mode, fallback, fallbackMemberId,
                fallbackMemberId == null ? null : names.get(fallbackMemberId), routes);
    }

    /** Save the full routing config. Validates ops/fallback and route members. */
    @Transactional
    public RoutingConfig setConfig(RoutingConfig req) {
        UUID cid = companyId();
        String mode = req.mode() == null ? "MANUAL" : req.mode();
        if (!ALLOWED_MODES.contains(mode)) throw ApiException.badRequest("mode must be one of " + ALLOWED_MODES);
        String fallback = req.fallback() == null ? "LEAST_LOADED" : req.fallback();
        if (!ALLOWED_FALLBACKS.contains(fallback)) throw ApiException.badRequest("fallback must be one of " + ALLOWED_FALLBACKS);

        Set<UUID> accepted = new HashSet<>(memberships.findAcceptedMemberIds(cid));

        UUID fallbackMemberId = req.fallbackMemberId();
        if ("MEMBER".equals(fallback)) {
            if (fallbackMemberId == null || !accepted.contains(fallbackMemberId)) {
                throw ApiException.badRequest("Choose an active member to assign all leads to.");
            }
        } else {
            fallbackMemberId = null;
        }

        List<Map<String, Object>> routes = new ArrayList<>();
        if (req.routes() != null) {
            for (RoutingConfig.Route r : req.routes()) {
                if (r.field() == null || r.field().isBlank()) throw ApiException.badRequest("Each rule needs a field.");
                String op = r.op() == null ? "equals" : r.op();
                if (!ALLOWED_OPS.contains(op)) throw ApiException.badRequest("Invalid operator: " + op);
                if (r.memberAccountId() == null || !accepted.contains(r.memberAccountId())) {
                    throw ApiException.badRequest("Each rule must target an accepted team member.");
                }
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("field", r.field().trim());
                m.put("op", op);
                m.put("value", r.value() == null ? "" : r.value().trim());
                m.put("memberAccountId", r.memberAccountId().toString());
                routes.add(m);
            }
        }

        AssignmentRule rule = rules.findByCompanyIdAndProductIdIsNull(cid)
                .orElseGet(() -> AssignmentRule.builder().companyId(cid).build());
        rule.setMode(mode);
        Map<String, Object> cfg = new HashMap<>();
        cfg.put("fallback", fallback);
        if (fallbackMemberId != null) cfg.put("fallbackMemberId", fallbackMemberId.toString());
        cfg.put("routes", routes);
        rule.setConfig(cfg);
        rules.save(rule);
        return getConfig();
    }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }

    private static UUID parseId(Object o) {
        if (o == null) return null;
        try { return UUID.fromString(String.valueOf(o)); } catch (Exception e) { return null; }
    }
}
