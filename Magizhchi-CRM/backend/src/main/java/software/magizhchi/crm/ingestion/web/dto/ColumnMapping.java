package software.magizhchi.crm.ingestion.web.dto;

import java.util.List;

/**
 * User-chosen column mapping for an import.
 * - nameColumn:  header to use as the lead's name
 * - phoneColumns: one or more headers to use as phone numbers (first non-empty
 *                 becomes the primary phone; all are kept in custom fields)
 * - emailColumn: header to use as email (optional)
 * - dedupe:      skip rows whose primary phone/email already exists
 * All columns are always stored in custom fields regardless of mapping.
 */
public record ColumnMapping(
        String nameColumn,
        List<String> phoneColumns,
        String emailColumn,
        Boolean dedupe
) {}
