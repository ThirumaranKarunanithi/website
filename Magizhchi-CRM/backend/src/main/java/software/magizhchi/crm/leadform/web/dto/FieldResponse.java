package software.magizhchi.crm.leadform.web.dto;

import software.magizhchi.crm.leadform.domain.LeadFormField;

import java.util.List;
import java.util.UUID;

public record FieldResponse(
        UUID id,
        String fieldKey,
        String label,
        String type,
        String role,
        boolean required,
        List<String> options,
        String placeholder,
        int sortOrder
) {
    public static FieldResponse from(LeadFormField f) {
        return new FieldResponse(
                f.getId(), f.getFieldKey(), f.getLabel(), f.getType(), f.getRole(),
                f.isRequired(), f.getOptions(), f.getPlaceholder(), f.getSortOrder());
    }
}
