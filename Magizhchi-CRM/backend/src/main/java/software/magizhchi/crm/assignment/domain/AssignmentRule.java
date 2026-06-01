package software.magizhchi.crm.assignment.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Company-level assignment policy. Phase 3 uses the company default row
 * (product_id IS NULL). Mode values are constrained by the DB to
 * MANUAL / ROUND_ROBIN / LOAD_BALANCED / BY_DESIGNATION / RULE.
 * The Leads UI exposes two of these: MANUAL and LOAD_BALANCED ("Automatic").
 */
@Entity
@Table(name = "assignment_rule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentRule {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(nullable = false, length = 30)
    private String mode;

    /**
     * Auto-assignment config (used when mode = LOAD_BALANCED):
     *  {
     *    "routes": [ {"field":"area","op":"equals","value":"Madurai","memberAccountId":"..."}, ... ],
     *    "fallback": "LEAST_LOADED" | "UNASSIGNED"
     *  }
     * Routes are evaluated in order; first match wins; else fallback.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> config;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (mode == null) mode = "MANUAL";
        if (config == null) config = new HashMap<>();
    }
}
