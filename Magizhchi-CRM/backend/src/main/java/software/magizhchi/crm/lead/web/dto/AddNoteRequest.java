package software.magizhchi.crm.lead.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AddNoteRequest(@NotBlank String note) {}
