package software.magizhchi.crm.membership.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "membership")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Membership {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "member_account_id", nullable = false)
    private UUID memberAccountId;

    @Column(name = "designation_id")
    private UUID designationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipStatus status;

    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    /** Manager capability: may view all company leads and assign them. */
    @Column(name = "can_assign", nullable = false)
    private boolean canAssign;

    @PrePersist
    void onCreate() {
        if (invitedAt == null) invitedAt = Instant.now();
        if (status == null) status = MembershipStatus.PENDING;
    }
}
