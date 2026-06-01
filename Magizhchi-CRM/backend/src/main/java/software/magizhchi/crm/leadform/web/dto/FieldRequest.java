package software.magizhchi.crm.leadform.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * Create/update one form field.
 *  - type: TEXT|TEXTAREA|NUMBER|PHONE|EMAIL|DATE|DROPDOWN
 *  - role: NONE|NAME|PHONE|EMAIL (maps the value to a core lead column)
 */
public record FieldRequest(
        String fieldKey,
        @NotBlank String label,
        String type,
        String role,
        Boolean required,
        List<String> options,
        String placeholder
) {}
