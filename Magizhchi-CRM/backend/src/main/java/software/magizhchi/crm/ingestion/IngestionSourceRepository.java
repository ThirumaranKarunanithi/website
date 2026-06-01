package software.magizhchi.crm.ingestion;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.ingestion.domain.IngestionSource;

import java.util.List;
import java.util.UUID;

public interface IngestionSourceRepository extends JpaRepository<IngestionSource, UUID> {
    List<IngestionSource> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
