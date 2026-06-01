package software.magizhchi.crm.reminder.web.dto;

import java.time.Instant;
import java.util.UUID;

/** A follow-up row for the Follow-ups screen. */
public record ReminderRow(
        UUID id,
        UUID leadId,
        String leadName,
        String leadPhone,
        UUID memberAccountId,
        String memberName,
        Instant remindAt,
        String note,
        String status,
        boolean overdue
) {}
