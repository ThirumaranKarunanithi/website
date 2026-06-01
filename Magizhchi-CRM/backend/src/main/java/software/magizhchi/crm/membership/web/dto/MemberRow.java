package software.magizhchi.crm.membership.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** A row in the company's Members list, incl. cross-company membership info. */
public record MemberRow(
        UUID membershipId,
        UUID memberAccountId,
        String displayName,
        String email,
        String phone,
        UUID designationId,
        String designationName,
        String status,
        Instant invitedAt,
        Instant acceptedAt,
        boolean canAssign,       // manager: can view all company leads & assign them
        int companyCount,        // how many companies this member is active in (incl. this one)
        List<String> companies   // names of those companies
) {}
