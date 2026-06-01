package software.magizhchi.crm.lead.web.dto;

import jakarta.validation.constraints.Email;

/**
 * Edit a single lead's core fields. Null fields are left unchanged; blank
 * strings clear the field.
 */
public record UpdateLeadRequest(
        String name,
        String phone,
        @Email String email
) {}
