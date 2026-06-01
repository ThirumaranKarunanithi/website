package software.magizhchi.crm.lead.web.dto;

import java.util.List;

public record LeadDetailResponse(
        LeadResponse lead,
        List<LeadEventResponse> timeline
) {}
