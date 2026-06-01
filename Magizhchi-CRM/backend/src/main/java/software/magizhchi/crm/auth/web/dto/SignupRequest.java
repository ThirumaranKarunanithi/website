package software.magizhchi.crm.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import software.magizhchi.crm.auth.domain.AccountType;

/**
 * Unified signup. accountType decides which optional fields are required:
 *  - COMPANY -> companyName required
 *  - MEMBER  -> displayName required
 */
public record SignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotNull AccountType accountType,
        String companyName,
        String displayName,
        String phone
) {}
