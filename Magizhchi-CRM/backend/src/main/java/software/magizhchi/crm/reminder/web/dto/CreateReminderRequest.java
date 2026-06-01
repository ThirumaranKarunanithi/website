package software.magizhchi.crm.reminder.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

/** Set a reminder on a lead: when + an optional note. */
public record CreateReminderRequest(
        @NotNull Instant remindAt,
        String note
) {}
