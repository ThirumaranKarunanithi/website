package software.magizhchi.crm.ingestion.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * A configured inbound lead channel. Maps to the {@code ingestion_source} table.
 * Display name, channel (INSTAGRAM/GOOGLE_FORM/GENERIC/REST) and the field
 * mapping all live in {@link #config} (jsonb) so no schema change was needed.
 *
 * - API sources authenticate with an API key (only its hash is stored).
 * - WEBHOOK sources authenticate with a token carried in the URL.
 */
@Entity
@Table(name = "ingestion_source")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestionSource {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(nullable = false, length = 20)
    private String type; // API | WEBHOOK (DB check also allows EXCEL)

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> config;

    @Column(name = "api_key_hash")
    private String apiKeyHash;

    @Column(name = "webhook_secret")
    private String webhookSecret;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (config == null) config = new HashMap<>();
    }
}
