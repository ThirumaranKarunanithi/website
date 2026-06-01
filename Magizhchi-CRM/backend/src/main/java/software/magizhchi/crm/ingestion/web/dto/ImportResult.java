package software.magizhchi.crm.ingestion.web.dto;

import java.util.List;

public record ImportResult(int imported, int skipped, List<String> errors) {}
