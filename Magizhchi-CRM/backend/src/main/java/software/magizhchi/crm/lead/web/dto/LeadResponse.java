package software.magizhchi.crm.lead.web.dto;

import software.magizhchi.crm.lead.domain.Lead;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record LeadResponse(
        UUID id,
        String name,
        String phone,
        String email,
        String status,
        String source,
        UUID productId,
        UUID assignedMemberId,
        String assignedMemberName,
        Map<String, Object> customFields,
        Instant createdAt,
        Instant updatedAt
) {
    public static LeadResponse from(Lead l, String assignedMemberName) {
        return new LeadResponse(
                l.getId(), l.getName(), l.getPhone(), l.getEmail(),
                l.getStatus().name(), l.getSource().name(),
                l.getProductId(), l.getAssignedMemberId(), assignedMemberName,
                l.getCustomFields(),
                l.getCreatedAt(), l.getUpdatedAt());
    }
}
