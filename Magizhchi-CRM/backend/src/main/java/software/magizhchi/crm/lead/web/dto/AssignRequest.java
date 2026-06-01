package software.magizhchi.crm.lead.web.dto;

import java.util.UUID;

/**
 * Manual assignment: provide memberAccountId.
 * Auto assignment: set auto=true (memberAccountId ignored; server picks by policy).
 */
public record AssignRequest(UUID memberAccountId, boolean auto) {}
