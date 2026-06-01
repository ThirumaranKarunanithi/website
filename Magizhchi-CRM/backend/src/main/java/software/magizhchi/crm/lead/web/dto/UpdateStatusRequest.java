package software.magizhchi.crm.lead.web.dto;

import jakarta.validation.constraints.NotNull;
import software.magizhchi.crm.lead.domain.LeadStatus;

public record UpdateStatusRequest(@NotNull LeadStatus status) {}
