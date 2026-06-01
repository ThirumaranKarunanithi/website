package software.magizhchi.crm.leadform.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One field in a company's custom Add-Lead form.
 *  - type: input control (TEXT/TEXTAREA/NUMBER/PHONE/EMAIL/DATE/DROPDOWN)
 *  - role: links the field's value to a core lead column (NAME/PHONE/EMAIL) or
 *          NONE (stored only in the lead's customFields)
 *  - sortOrder: display order in the form
 */
@Entity
@Table(name = "lead_form_field")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadFormField {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "field_key", nullable = false, length = 80)
    private String fieldKey;

    @Column(nullable = false, length = 160)
    private String label;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false)
    private boolean required;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(length = 160)
    private String placeholder;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (options == null) options = new ArrayList<>();
        if (type == null) type = "TEXT";
        if (role == null) role = "NONE";
    }
}
