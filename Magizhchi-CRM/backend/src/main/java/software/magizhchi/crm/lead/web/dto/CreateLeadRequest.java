package software.magizhchi.crm.lead.web.dto;

import jakarta.validation.constraints.Email;

import java.util.Map;
import java.util.UUID;

/**
 * Create a lead. Two modes:
 *  - Legacy/simple: name/phone/email directly.
 *  - Form-builder: {@code fields} = a map of formFieldKey -> value. The server
 *    maps role fields (NAME/PHONE/EMAIL) to core columns and stores ALL of them
 *    in the lead's customFields. Required-field validation uses the company form.
 */
public record CreateLeadRequest(
        String name,
        String phone,
        @Email String email,
        UUID productId,
        Map<String, Object> fields
) {}
