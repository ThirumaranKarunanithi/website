package software.magizhchi.crm.leadform;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.leadform.domain.LeadFormField;

import java.util.List;
import java.util.UUID;

public interface LeadFormFieldRepository extends JpaRepository<LeadFormField, UUID> {
    List<LeadFormField> findByCompanyIdOrderBySortOrderAsc(UUID companyId);
    long countByCompanyId(UUID companyId);
    void deleteByCompanyId(UUID companyId);
}
