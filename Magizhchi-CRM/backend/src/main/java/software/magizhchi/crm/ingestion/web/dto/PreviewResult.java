package software.magizhchi.crm.ingestion.web.dto;

import java.util.List;
import java.util.Map;

/**
 * Result of inspecting an uploaded file WITHOUT importing it.
 * - headers: column names in order
 * - sampleRows: first few rows as header->value maps (for a preview table)
 * - totalRows: number of data rows (excluding header)
 * - suggested: auto-guessed mapping the UI pre-selects (name/email single, phones list)
 */
public record PreviewResult(
        List<String> headers,
        List<Map<String, String>> sampleRows,
        int totalRows,
        SuggestedMapping suggested
) {
    public record SuggestedMapping(String name, List<String> phones, String email) {}
}
