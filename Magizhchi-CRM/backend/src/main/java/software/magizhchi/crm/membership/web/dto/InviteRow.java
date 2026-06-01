package software.magizhchi.crm.membership.web.dto;

import java.time.Instant;
import java.util.UUID;

/** A pending invite or joined-company row shown to a member. */
public record InviteRow(
        UUID membershipId,
        UUID companyId,
        String companyName,
        String designationName,
        String status,
        Instant invitedAt,
        Instant acceptedAt
) {}
