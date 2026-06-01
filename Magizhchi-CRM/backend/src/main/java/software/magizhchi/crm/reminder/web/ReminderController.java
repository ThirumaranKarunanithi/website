package software.magizhchi.crm.reminder.web;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import software.magizhchi.crm.reminder.ReminderService;
import software.magizhchi.crm.reminder.web.dto.CreateReminderRequest;
import software.magizhchi.crm.reminder.web.dto.ReminderRow;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ReminderController {

    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    /** Company: set a reminder on a lead. */
    @PostMapping("/leads/{leadId}/reminders")
    public ReminderRow create(@PathVariable UUID leadId,
                              @Valid @RequestBody CreateReminderRequest request) {
        return service.create(leadId, request);
    }

    /** Company: all follow-ups (optionally ?status=PENDING|DONE|CANCELLED). */
    @GetMapping("/reminders")
    public List<ReminderRow> list(@RequestParam(required = false) String status) {
        return service.listForCompany(status);
    }

    /** Member: my own pending follow-ups. */
    @GetMapping("/my/reminders")
    public List<ReminderRow> myReminders() {
        return service.listForMember();
    }

    @PatchMapping("/reminders/{id}/done")
    public ReminderRow markDone(@PathVariable UUID id) {
        return service.markDone(id);
    }

    @DeleteMapping("/reminders/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
