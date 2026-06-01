package software.magizhchi.crm.leadform;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.leadform.domain.LeadFormField;
import software.magizhchi.crm.leadform.web.dto.FieldRequest;
import software.magizhchi.crm.leadform.web.dto.FieldResponse;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class LeadFormService {

    private static final Set<String> TYPES =
            Set.of("TEXT", "TEXTAREA", "NUMBER", "PHONE", "EMAIL", "DATE", "DROPDOWN");
    private static final Set<String> ROLES = Set.of("NONE", "NAME", "PHONE", "EMAIL");

    private final LeadFormFieldRepository fields;

    public LeadFormService(LeadFormFieldRepository fields) {
        this.fields = fields;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can design the lead form.");
        return cid;
    }

    /** Fields for the current company; seeds a sensible default set on first use. */
    @Transactional
    public List<FieldResponse> list() {
        UUID cid = companyId();
        if (fields.countByCompanyId(cid) == 0) {
            seedDefaults(cid);
        }
        return fields.findByCompanyIdOrderBySortOrderAsc(cid).stream()
                .map(FieldResponse::from).toList();
    }

    @Transactional
    public FieldResponse add(FieldRequest req) {
        UUID cid = companyId();
        String type = normType(req.type());
        String role = normRole(req.role());
        String key = StringUtils.hasText(req.fieldKey()) ? slug(req.fieldKey()) : slug(req.label());
        // ensure unique key within company
        key = uniqueKey(cid, key);
        int nextOrder = fields.findByCompanyIdOrderBySortOrderAsc(cid).size();
        LeadFormField f = LeadFormField.builder()
                .companyId(cid)
                .fieldKey(key)
                .label(req.label().trim())
                .type(type)
                .role(role)
                .required(Boolean.TRUE.equals(req.required()))
                .options(req.options() == null ? new ArrayList<>() : req.options())
                .placeholder(req.placeholder())
                .sortOrder(nextOrder)
                .build();
        return FieldResponse.from(fields.save(f));
    }

    @Transactional
    public FieldResponse update(UUID id, FieldRequest req) {
        LeadFormField f = owned(id);
        f.setLabel(req.label().trim());
        f.setType(normType(req.type()));
        f.setRole(normRole(req.role()));
        f.setRequired(Boolean.TRUE.equals(req.required()));
        f.setOptions(req.options() == null ? new ArrayList<>() : req.options());
        f.setPlaceholder(req.placeholder());
        return FieldResponse.from(fields.save(f));
    }

    @Transactional
    public void delete(UUID id) {
        fields.delete(owned(id));
    }

    /** Persist a new display order given the field ids top-to-bottom. */
    @Transactional
    public void reorder(List<UUID> orderedIds) {
        UUID cid = companyId();
        List<LeadFormField> current = fields.findByCompanyIdOrderBySortOrderAsc(cid);
        int i = 0;
        for (UUID id : orderedIds) {
            for (LeadFormField f : current) {
                if (f.getId().equals(id)) { f.setSortOrder(i++); break; }
            }
        }
        fields.saveAll(current);
    }

    @Transactional
    public List<FieldResponse> resetToDefault() {
        UUID cid = companyId();
        fields.deleteByCompanyId(cid);
        seedDefaults(cid);
        return list();
    }

    private LeadFormField owned(UUID id) {
        LeadFormField f = fields.findById(id)
                .orElseThrow(() -> ApiException.notFound("Field not found."));
        if (!f.getCompanyId().equals(companyId())) throw ApiException.notFound("Field not found.");
        return f;
    }

    private void seedDefaults(UUID cid) {
        List<LeadFormField> defaults = List.of(
                LeadFormField.builder().companyId(cid).fieldKey("name").label("Full Name")
                        .type("TEXT").role("NAME").required(true).placeholder("Lead name").sortOrder(0).build(),
                LeadFormField.builder().companyId(cid).fieldKey("phone").label("Phone")
                        .type("PHONE").role("PHONE").required(false).placeholder("+91…").sortOrder(1).build(),
                LeadFormField.builder().companyId(cid).fieldKey("email").label("Email")
                        .type("EMAIL").role("EMAIL").required(false).placeholder("lead@email.com").sortOrder(2).build());
        fields.saveAll(defaults);
    }

    private String normType(String t) {
        if (t == null) return "TEXT";
        String u = t.toUpperCase();
        if (!TYPES.contains(u)) throw ApiException.badRequest("Invalid field type: " + t);
        return u;
    }

    private String normRole(String r) {
        if (r == null) return "NONE";
        String u = r.toUpperCase();
        if (!ROLES.contains(u)) throw ApiException.badRequest("Invalid field role: " + r);
        return u;
    }

    private String slug(String s) {
        String base = s == null ? "field" : s.toLowerCase().trim().replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
        return base.isEmpty() ? "field" : base;
    }

    private String uniqueKey(UUID cid, String key) {
        Set<String> taken = new java.util.HashSet<>();
        for (LeadFormField f : fields.findByCompanyIdOrderBySortOrderAsc(cid)) {
            taken.add(f.getFieldKey());
        }
        if (!taken.contains(key)) return key;
        int n = 2;
        while (taken.contains(key + "_" + n)) n++;
        return key + "_" + n;
    }
}
