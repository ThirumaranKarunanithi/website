package software.magizhchi.crm.lead.web.dto;

public record LeadStatsResponse(
        long total,
        long isNew,
        long assigned,
        long followUp,
        long won,
        long lost
) {}
