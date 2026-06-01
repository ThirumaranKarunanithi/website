package software.magizhchi.crm.lead.web.dto;

import java.util.List;

/**
 * Re-derive Name / Phone / Email for existing leads from the columns saved in
 * each lead's customFields (e.g. fix a wrong import mapping without re-importing).
 * Only the provided (non-null) targets are changed; others are left as-is.
 *  - nameColumn:  customFields key to copy into the lead's name
 *  - phoneColumns: ordered keys; first non-empty becomes the primary phone
 *  - emailColumn: customFields key to copy into email
 *  - onlySource:  if set (e.g. "EXCEL"), only re-map leads from that source
 */
public record RemapRequest(
        String nameColumn,
        List<String> phoneColumns,
        String emailColumn,
        String onlySource
) {}
