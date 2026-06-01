package software.magizhchi.crm.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.assignment.domain.AssignmentRule;

import java.util.Optional;
import java.util.UUID;

public interface AssignmentRuleRepository extends JpaRepository<AssignmentRule, UUID> {
    Optional<AssignmentRule> findByCompanyIdAndProductIdIsNull(UUID companyId);
}
