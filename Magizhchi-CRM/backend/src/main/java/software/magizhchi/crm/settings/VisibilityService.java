package software.magizhchi.crm.settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.settings.domain.VisibilitySetting;
import software.magizhchi.crm.tenancy.TenantContext;

import java.util.*;

/**
 * Field visibility for members. A field is HIDDEN only if a setting row exists
 * with visible=false. Absent = visible (sensible default: members see everything
 * until the company hides specific fields).
 */
@Service
public class VisibilityService {

    private final VisibilitySettingRepository repo;

    public VisibilityService(VisibilitySettingRepository repo) {
        this.repo = repo;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can change settings.");
        return cid;
    }

    public record FieldVisibility(String fieldKey, boolean visible) {}

    @Transactional(readOnly = true)
    public List<FieldVisibility> list() {
        return repo.findByCompanyId(companyId()).stream()
                .map(v -> new FieldVisibility(v.getFieldKey(), v.isVisible()))
                .toList();
    }

    /** Replace the company's hidden-field set with exactly the given keys. */
    @Transactional
    public List<FieldVisibility> setHidden(List<String> hiddenKeys) {
        UUID cid = companyId();
        repo.deleteByCompanyId(cid);
        List<VisibilitySetting> rows = new ArrayList<>();
        if (hiddenKeys != null) {
            for (String k : new LinkedHashSet<>(hiddenKeys)) {
                if (k == null || k.isBlank()) continue;
                rows.add(VisibilitySetting.builder()
                        .companyId(cid).fieldKey(k.trim()).visible(false).masked(false).build());
            }
        }
        repo.saveAll(rows);
        return list();
    }

    /** Hidden field keys for a company (used by the member lead view). */
    @Transactional(readOnly = true)
    public Set<String> hiddenKeys(UUID companyId) {
        Set<String> hidden = new HashSet<>();
        for (VisibilitySetting v : repo.findByCompanyId(companyId)) {
            if (!v.isVisible()) hidden.add(norm(v.getFieldKey()));
        }
        return hidden;
    }

    public static String norm(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[\\s_\\-]", "");
    }
}
