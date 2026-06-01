package software.magizhchi.crm.lead.web.dto;

import software.magizhchi.crm.lead.domain.Lead;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** A lead as seen by a member (includes which company it belongs to). */
public record MemberLeadResponse(
        UUID id,
        String name,
        String phone,
        String email,
        String status,
        String source,
        UUID companyId,
        String companyName,
        Map<String, Object> customFields,
        Instant createdAt,
        Instant updatedAt
) {
    public static MemberLeadResponse from(Lead l, String companyName) {
        return new MemberLeadResponse(
                l.getId(), l.getName(), l.getPhone(), l.getEmail(),
                l.getStatus().name(), l.getSource().name(),
                l.getCompanyId(), companyName, l.getCustomFields(),
                l.getCreatedAt(), l.getUpdatedAt());
    }
}
