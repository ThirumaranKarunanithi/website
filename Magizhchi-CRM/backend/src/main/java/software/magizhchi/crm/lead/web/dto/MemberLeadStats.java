package software.magizhchi.crm.lead.web.dto;

import java.util.UUID;

/** Per-member lead breakdown for the team performance table. */
public record MemberLeadStats(
        UUID memberAccountId,
        String memberName,
        String email,
        long total,
        long isNew,
        long assigned,
        long followUp,
        long won,
        long lost
) {}
