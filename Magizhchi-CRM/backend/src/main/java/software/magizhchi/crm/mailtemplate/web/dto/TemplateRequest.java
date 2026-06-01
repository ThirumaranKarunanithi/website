package software.magizhchi.crm.mailtemplate.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TemplateRequest(
        @NotBlank String code,
        @NotBlank String subject,
        @NotBlank String body
) {}
