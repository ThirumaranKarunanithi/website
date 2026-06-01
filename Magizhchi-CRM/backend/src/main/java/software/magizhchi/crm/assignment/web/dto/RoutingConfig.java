package software.magizhchi.crm.assignment.web.dto;

import java.util.List;
import java.util.UUID;

/**
 * The full auto-assignment configuration for a company.
 *  - mode: MANUAL | LOAD_BALANCED (LOAD_BALANCED = "Automatic"/on)
 *  - fallback: when no route matches — LEAST_LOADED | UNASSIGNED
 *  - routes: ordered field-based rules
 */
public record RoutingConfig(
        String mode,
        String fallback,            // LEAST_LOADED | UNASSIGNED | MEMBER
        UUID fallbackMemberId,      // required when fallback = MEMBER (assign all to this member)
        String fallbackMemberName,  // populated on read
        List<Route> routes
) {
    /**
     * One routing rule. op: equals | contains | in | gte | lte (numeric for gte/lte).
     * field is a lead field key (name/phone/email or any custom field like area/age/occupation).
     */
    public record Route(
            String field,
            String op,
            String value,
            UUID memberAccountId,
            String memberName // populated on read
    ) {}
}
