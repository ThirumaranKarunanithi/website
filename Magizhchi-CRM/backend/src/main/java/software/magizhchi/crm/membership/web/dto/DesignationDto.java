package software.magizhchi.crm.membership.web.dto;

import software.magizhchi.crm.membership.domain.Designation;

import java.util.UUID;

public record DesignationDto(UUID id, String name) {
    public static DesignationDto from(Designation d) {
        return new DesignationDto(d.getId(), d.getName());
    }
}
