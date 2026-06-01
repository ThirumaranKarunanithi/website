package software.magizhchi.crm.reminder.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A follow-up reminder on a lead: a note + a due time. Surfaced on the
 * Follow-ups screen (Overdue / Today / Upcoming) until marked DONE.
 */
@Entity
@Table(name = "reminder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    /** Who the reminder is for (the assigned member, or the creator if unassigned). */
    @Column(name = "member_account_id", nullable = false)
    private UUID memberAccountId;

    @Column(name = "remind_at", nullable = false)
    private Instant remindAt;

    @Column
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = ReminderStatus.PENDING;
    }
}
