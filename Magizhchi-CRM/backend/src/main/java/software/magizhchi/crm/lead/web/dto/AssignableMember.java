package software.magizhchi.crm.lead.web.dto;

import java.util.UUID;

public record AssignableMember(UUID accountId, String displayName, String email) {}
