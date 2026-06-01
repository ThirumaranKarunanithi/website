package software.magizhchi.crm.mailtemplate;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.mailtemplate.domain.MailTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MailTemplateRepository extends JpaRepository<MailTemplate, UUID> {
    List<MailTemplate> findByCompanyIdOrderByCodeAsc(UUID companyId);
    Optional<MailTemplate> findByCompanyIdAndCodeIgnoreCase(UUID companyId, String code);
    boolean existsByCompanyIdAndCodeIgnoreCase(UUID companyId, String code);
    Optional<MailTemplate> findByIdAndCompanyId(UUID id, UUID companyId);
}
