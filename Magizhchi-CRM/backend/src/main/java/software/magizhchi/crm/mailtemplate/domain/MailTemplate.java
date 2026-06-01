package software.magizhchi.crm.mailtemplate.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A company's reusable email template, addressed by a short {@code code}
 * (e.g. WELCOME01). Subject/body may contain merge variables like
 * {{lead.name}}, {{member.name}}, {{company.name}}.
 */
@Entity
@Table(name = "mail_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MailTemplate {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(nullable = false, length = 40)
    private String code;

    @Column(nullable = false, length = 300)
    private String subject;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
