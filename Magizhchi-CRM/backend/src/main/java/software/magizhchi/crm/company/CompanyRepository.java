package software.magizhchi.crm.company;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.company.domain.Company;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findByAccountId(UUID accountId);
}
