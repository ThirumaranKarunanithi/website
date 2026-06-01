package software.magizhchi.crm.auth.web.dto;

import software.magizhchi.crm.auth.domain.AccountType;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        long expiresInMinutes,
        UUID accountId,
        AccountType accountType,
        UUID companyId,
        String displayName
) {}
