package software.magizhchi.crm.tenancy;

import software.magizhchi.crm.auth.domain.AccountType;

import java.util.UUID;

/**
 * Request-scoped holder for the authenticated principal's tenancy info.
 * Populated by {@code JwtAuthFilter} and read by services/repositories to scope
 * every query by company. For COMPANY accounts {@link #getCompanyId()} is the
 * owned company; for MEMBER accounts it is null (members resolve their accessible
 * companies via accepted memberships).
 */
public final class TenantContext {

    public record Principal(UUID accountId, AccountType accountType, UUID companyId) {}

    private static final ThreadLocal<Principal> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Principal principal) {
        CURRENT.set(principal);
    }

    public static Principal get() {
        return CURRENT.get();
    }

    public static UUID accountId() {
        Principal p = CURRENT.get();
        return p == null ? null : p.accountId();
    }

    public static UUID companyId() {
        Principal p = CURRENT.get();
        return p == null ? null : p.companyId();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
