package software.magizhchi.crm.lead.web.dto;

import software.magizhchi.crm.lead.domain.LeadEvent;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record LeadEventResponse(
        UUID id,
        String type,
        Map<String, Object> payload,
        String actorName,
        Instant createdAt
) {
    public static LeadEventResponse from(LeadEvent e, String actorName) {
        return new LeadEventResponse(
                e.getId(), e.getType().name(), e.getPayload(), actorName, e.getCreatedAt());
    }
}
