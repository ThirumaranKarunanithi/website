package software.magizhchi.crm.reminder;

import org.springframework.data.jpa.repository.JpaRepository;
import software.magizhchi.crm.reminder.domain.Reminder;
import software.magizhchi.crm.reminder.domain.ReminderStatus;

import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    // Company-wide follow-ups, soonest first.
    List<Reminder> findByCompanyIdAndStatusOrderByRemindAtAsc(UUID companyId, ReminderStatus status);

    List<Reminder> findByCompanyIdOrderByRemindAtAsc(UUID companyId);

    // A member's own follow-ups across companies.
    List<Reminder> findByMemberAccountIdAndStatusOrderByRemindAtAsc(UUID memberAccountId, ReminderStatus status);

    List<Reminder> findByLeadIdOrderByRemindAtAsc(UUID leadId);
}
