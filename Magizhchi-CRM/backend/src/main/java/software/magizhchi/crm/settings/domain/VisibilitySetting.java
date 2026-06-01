package software.magizhchi.crm.settings.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Per-company control of which lead fields members can see.
 * field_key is a lead field ("name","phone","email","source") or a custom column.
 * visible=false hides it; masked=true shows a partially-masked value.
 */
@Entity
@Table(name = "visibility_setting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisibilitySetting {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "field_key", nullable = false, length = 80)
    private String fieldKey;

    @Column(nullable = false)
    private boolean visible;

    @Column(nullable = false)
    private boolean masked;
}
