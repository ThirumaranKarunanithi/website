package software.magizhchi.crm.mailtemplate.web.dto;

import software.magizhchi.crm.mailtemplate.domain.MailTemplate;

import java.time.Instant;
import java.util.UUID;

public record TemplateResponse(
        UUID id,
        String code,
        String subject,
        String body,
        Instant createdAt
) {
    public static TemplateResponse from(MailTemplate t) {
        return new TemplateResponse(t.getId(), t.getCode(), t.getSubject(), t.getBody(), t.getCreatedAt());
    }
}
