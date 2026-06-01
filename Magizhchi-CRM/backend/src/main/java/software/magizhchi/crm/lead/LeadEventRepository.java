package software.magizhchi.crm.lead;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.lead.domain.LeadEvent;

import java.util.List;
import java.util.UUID;

public interface LeadEventRepository extends JpaRepository<LeadEvent, UUID> {
    List<LeadEvent> findByLeadIdOrderByCreatedAtDesc(UUID leadId);
}
