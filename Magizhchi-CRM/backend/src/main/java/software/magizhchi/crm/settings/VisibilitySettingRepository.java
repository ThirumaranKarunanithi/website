package software.magizhchi.crm.settings;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.settings.domain.VisibilitySetting;

import java.util.List;
import java.util.UUID;

public interface VisibilitySettingRepository extends JpaRepository<VisibilitySetting, UUID> {
    List<VisibilitySetting> findByCompanyId(UUID companyId);
    void deleteByCompanyId(UUID companyId);
}
