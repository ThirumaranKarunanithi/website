package software.magizhchi.crm.membership.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/** Company invites a member by email, optionally with a designation. */
public record InviteRequest(
        @NotBlank @Email String email,
        UUID designationId
) {}
