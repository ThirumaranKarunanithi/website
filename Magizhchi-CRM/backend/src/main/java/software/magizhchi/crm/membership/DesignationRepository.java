package software.magizhchi.crm.membership;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.membership.domain.Designation;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DesignationRepository extends JpaRepository<Designation, UUID> {
    List<Designation> findByCompanyIdOrderByName(UUID companyId);
    List<Designation> findByIdIn(Collection<UUID> ids);
    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);
}
