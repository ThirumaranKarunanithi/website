package software.magizhchi.crm.ingestion;

import org.apache.poi.ss.usermodel.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.magizhchi.crm.common.ApiException;
import software.magizhchi.crm.ingestion.domain.IngestionSource;
import software.magizhchi.crm.ingestion.web.dto.*;
import software.magizhchi.crm.lead.LeadService;
import software.magizhchi.crm.lead.domain.LeadSource;
import software.magizhchi.crm.tenancy.TenantContext;

import java.io.InputStream;
import java.security.SecureRandom;
import java.util.*;

@Service
public class IngestionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String API_KEY_HEADER = "X-API-Key";

    private final IngestionSourceRepository sources;
    private final LeadService leadService;
    private final PasswordEncoder passwordEncoder;

    public IngestionService(IngestionSourceRepository sources,
                            LeadService leadService,
                            PasswordEncoder passwordEncoder) {
        this.sources = sources;
        this.leadService = leadService;
        this.passwordEncoder = passwordEncoder;
    }

    private UUID companyId() {
        UUID cid = TenantContext.companyId();
        if (cid == null) throw ApiException.forbidden("Only company accounts can manage lead sources.");
        return cid;
    }

    // ---- Source management (authenticated) --------------------------------

    @Transactional(readOnly = true)
    public List<SourceResponse> list() {
        return sources.findByCompanyIdOrderByCreatedAtDesc(companyId()).stream()
                .map(s -> toResponse(s, null))
                .toList();
    }

    @Transactional
    public SourceResponse create(CreateSourceRequest req) {
        UUID cid = companyId();
        String type = req.type() == null ? "" : req.type().toUpperCase();
        if (!type.equals("API") && !type.equals("WEBHOOK")) {
            throw ApiException.badRequest("type must be API or WEBHOOK.");
        }

        Map<String, Object> config = new HashMap<>();
        config.put("name", req.name().trim());
        String channel = type.equals("WEBHOOK")
                ? normalizeChannel(req.channel())
                : "REST";
        config.put("channel", channel);
        if (req.mapping() != null && !req.mapping().isEmpty()) {
            config.put("mapping", req.mapping());
        }

        IngestionSource src = IngestionSource.builder()
                .companyId(cid)
                .type(type)
                .config(config)
                .enabled(true)
                .build();

        String plaintextApiKey = null;
        if (type.equals("API")) {
            plaintextApiKey = "mzk_" + randomToken(32);
            src.setApiKeyHash(passwordEncoder.encode(plaintextApiKey));
        } else {
            src.setWebhookSecret(randomToken(24)); // URL token
        }

        sources.save(src);
        return toResponse(src, plaintextApiKey);
    }

    @Transactional
    public SourceResponse setEnabled(UUID id, boolean enabled) {
        IngestionSource src = owned(id);
        src.setEnabled(enabled);
        sources.save(src);
        return toResponse(src, null);
    }

    @Transactional
    public void delete(UUID id) {
        sources.delete(owned(id));
    }

    private IngestionSource owned(UUID id) {
        IngestionSource src = sources.findById(id)
                .orElseThrow(() -> ApiException.notFound("Source not found."));
        if (!src.getCompanyId().equals(companyId())) {
            throw ApiException.notFound("Source not found.");
        }
        return src;
    }

    // ---- Excel / CSV import (authenticated) -------------------------------

    /** Parsed file: ordered headers + data rows as header->value maps. */
    private record Parsed(List<String> headers, List<Map<String, String>> rows) {}

    /** Inspect an uploaded file without importing — for the mapping UI. */
    @Transactional(readOnly = true)
    public PreviewResult preview(MultipartFile file) {
        companyId(); // authz
        Parsed parsed = parse(file);
        List<Map<String, String>> sample = parsed.rows().size() > 5
                ? parsed.rows().subList(0, 5) : parsed.rows();
        return new PreviewResult(
                parsed.headers(),
                new ArrayList<>(sample),
                parsed.rows().size(),
                suggest(parsed.headers()));
    }

    /**
     * Import using an explicit column mapping (from the mapping UI). If mapping is
     * null we fall back to auto-detection (API/back-compat).
     */
    @Transactional
    public ImportResult importExcel(MultipartFile file, ColumnMapping mapping) {
        UUID cid = companyId();
        Parsed parsed = parse(file);
        boolean dedupe = mapping == null || mapping.dedupe() == null || mapping.dedupe();

        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        int rowNum = 1;
        for (Map<String, String> rec : parsed.rows()) {
            rowNum++;
            String name, phone, email;
            if (mapping != null) {
                name = pick(rec, mapping.nameColumn());
                phone = firstPhone(rec, mapping.phoneColumns());
                email = pick(rec, mapping.emailColumn());
            } else {
                name = FieldMapper.name(rec, null);
                phone = FieldMapper.phone(rec, null);
                email = FieldMapper.email(rec, null);
            }
            boolean saved = leadService.ingest(cid, LeadSource.EXCEL,
                    name, phone, email, new LinkedHashMap<>(rec), dedupe);
            if (saved) imported++;
            else { skipped++; if (errors.size() < 20) errors.add("Row " + rowNum + ": skipped (duplicate or empty)"); }
        }
        return new ImportResult(imported, skipped, errors);
    }

    /** Value of one mapped column (exact, then normalized match), or null. */
    private static String pick(Map<String, String> rec, String column) {
        if (column == null || column.isBlank()) return null;
        if (rec.containsKey(column)) {
            String v = rec.get(column);
            return (v == null || v.isBlank()) ? null : v.trim();
        }
        String want = norm(column);
        for (Map.Entry<String, String> e : rec.entrySet()) {
            if (norm(e.getKey()).equals(want)) {
                String v = e.getValue();
                return (v == null || v.isBlank()) ? null : v.trim();
            }
        }
        return null;
    }

    /** First non-empty value across the mapped phone columns (primary phone). */
    private static String firstPhone(Map<String, String> rec, List<String> phoneColumns) {
        if (phoneColumns == null) return null;
        for (String col : phoneColumns) {
            String v = pick(rec, col);
            if (v != null) return v;
        }
        return null;
    }

    private static String norm(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[\\s_\\-]", "");
    }

    /** Guess a mapping from headers so the UI can pre-select sensible defaults. */
    private PreviewResult.SuggestedMapping suggest(List<String> headers) {
        String name = null, email = null;
        List<String> phones = new ArrayList<>();
        for (String h : headers) {
            String n = norm(h);
            if (name == null && (n.contains("name")) && !n.contains("user") && !n.contains("father")
                    && !n.contains("parent")) name = h;
            else if (name == null && n.equals("fullname")) name = h;
            if (email == null && n.contains("email") || n.equals("mail")) email = h;
            if (n.contains("phone") || n.contains("mobile") || n.contains("contact")
                    || n.contains("whatsapp") || n.endsWith("number")) phones.add(h);
        }
        // Fallback: any header literally called name
        if (name == null) {
            for (String h : headers) if (norm(h).contains("name")) { name = h; break; }
        }
        return new PreviewResult.SuggestedMapping(name, phones, email);
    }

    /** Parse .xlsx or .csv into headers + rows. */
    private Parsed parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded.");
        }
        String fname = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try (InputStream in = file.getInputStream()) {
            return fname.endsWith(".csv")
                    ? parseCsv(new String(in.readAllBytes()))
                    : parseXlsx(in);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.badRequest("Could not read the file. Use .xlsx or .csv with a header row.");
        }
    }

    private Parsed parseXlsx(InputStream in) throws Exception {
        try (Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw ApiException.badRequest("The sheet is empty.");
            }
            DataFormatter fmt = new DataFormatter();
            Iterator<Row> it = sheet.iterator();
            Row header = it.next();
            List<String> headers = new ArrayList<>();
            int lastCol = header.getLastCellNum();
            for (int i = 0; i < lastCol; i++) {
                Cell c = header.getCell(i);
                String h = c == null ? "" : fmt.formatCellValue(c).trim();
                headers.add(h.isBlank() ? ("Column " + (i + 1)) : h);
            }
            List<Map<String, String>> rows = new ArrayList<>();
            while (it.hasNext()) {
                Row row = it.next();
                Map<String, String> rec = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    Cell c = row.getCell(i);
                    rec.put(headers.get(i), c == null ? "" : fmt.formatCellValue(c).trim());
                }
                rows.add(rec);
            }
            return new Parsed(headers, rows);
        }
    }

    private Parsed parseCsv(String content) {
        String[] lines = content.replace("\r", "").split("\n");
        if (lines.length < 2) throw ApiException.badRequest("CSV needs a header row plus at least one data row.");
        String[] hdr = splitCsv(lines[0]);
        List<String> headers = new ArrayList<>();
        for (int i = 0; i < hdr.length; i++) {
            String h = hdr[i].trim();
            headers.add(h.isBlank() ? ("Column " + (i + 1)) : h);
        }
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].isBlank()) continue;
            String[] cells = splitCsv(lines[i]);
            Map<String, String> rec = new LinkedHashMap<>();
            for (int h = 0; h < headers.size(); h++) {
                rec.put(headers.get(h), h < cells.length ? cells[h].trim() : "");
            }
            rows.add(rec);
        }
        return new Parsed(headers, rows);
    }

    /** Minimal CSV splitter handling double-quoted fields with commas. */
    private static String[] splitCsv(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }
                else inQuotes = !inQuotes;
            } else if (ch == ',' && !inQuotes) {
                out.add(cur.toString()); cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out.toArray(new String[0]);
    }

    // ---- Public intake (API + webhook) -----------------------------------

    /** Web service: external system posts a single lead with an API key. */
    @Transactional
    public void ingestApi(UUID sourceId, String apiKey, Map<String, Object> body) {
        IngestionSource src = sources.findById(sourceId)
                .orElseThrow(() -> ApiException.notFound("Unknown source."));
        if (!src.isEnabled()) throw ApiException.forbidden("This source is disabled.");
        if (!"API".equals(src.getType())) throw ApiException.badRequest("Not an API source.");
        if (apiKey == null || src.getApiKeyHash() == null
                || !passwordEncoder.matches(apiKey, src.getApiKeyHash())) {
            throw ApiException.unauthorized("Invalid API key.");
        }
        saveFromRecord(src, body, LeadSource.API);
    }

    /** Webhook: Instagram form / Google form / generic. Token authenticates. */
    @Transactional
    public void ingestWebhook(UUID sourceId, String token, Map<String, Object> body) {
        IngestionSource src = sources.findById(sourceId)
                .orElseThrow(() -> ApiException.notFound("Unknown source."));
        if (!src.isEnabled()) throw ApiException.forbidden("This source is disabled.");
        if (!"WEBHOOK".equals(src.getType())) throw ApiException.badRequest("Not a webhook source.");
        if (token == null || !token.equals(src.getWebhookSecret())) {
            throw ApiException.unauthorized("Invalid webhook token.");
        }
        Map<String, Object> record = flatten(src, body);
        saveFromRecord(src, record, LeadSource.WEBHOOK);
    }

    @SuppressWarnings("unchecked")
    private void saveFromRecord(IngestionSource src, Map<String, Object> record, LeadSource source) {
        Map<String, String> mapping = (Map<String, String>) src.getConfig().get("mapping");
        boolean saved = leadService.ingest(
                src.getCompanyId(), source,
                FieldMapper.name(record, mapping),
                FieldMapper.phone(record, mapping),
                FieldMapper.email(record, mapping),
                record); // keep all submitted fields
        if (!saved) {
            throw ApiException.badRequest("Payload had no recognizable fields, or it is a duplicate.");
        }
    }

    /**
     * Normalize provider-specific payloads to a flat key->value map.
     * - Google Forms (via Apps Script) typically posts {"answers": {...}} or flat.
     * - Instagram Lead Ads (via a relay) often posts {"field_data":[{"name","values":[...]}]}.
     * - Generic: already flat.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> flatten(IngestionSource src, Map<String, Object> body) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (body == null) return out;

        // Instagram-style field_data array
        Object fieldData = body.get("field_data");
        if (fieldData instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Object key = m.get("name");
                    Object values = m.get("values");
                    String val = values instanceof List<?> vl && !vl.isEmpty()
                            ? String.valueOf(vl.get(0)) : String.valueOf(values);
                    if (key != null) out.put(String.valueOf(key), val);
                }
            }
            return out;
        }

        // Google-form-style nested "answers" / "response"
        Object answers = body.get("answers");
        if (answers == null) answers = body.get("response");
        if (answers instanceof Map<?, ?> m) {
            m.forEach((k, v) -> out.put(String.valueOf(k), v));
            return out;
        }

        // Already flat
        body.forEach(out::put);
        return out;
    }

    // ---- Mapping helpers --------------------------------------------------

    @SuppressWarnings("unchecked")
    private SourceResponse toResponse(IngestionSource s, String apiKeyOnce) {
        Map<String, Object> cfg = s.getConfig() == null ? Map.of() : s.getConfig();
        String name = String.valueOf(cfg.getOrDefault("name", ""));
        String channel = String.valueOf(cfg.getOrDefault("channel", s.getType()));
        Map<String, String> mapping = (Map<String, String>) cfg.get("mapping");

        String path;
        String webhookToken = null;
        String apiKeyHeader = null;
        if ("API".equals(s.getType())) {
            path = "/api/v1/ingest/" + s.getId() + "/leads";
            apiKeyHeader = API_KEY_HEADER;
        } else {
            webhookToken = s.getWebhookSecret();
            path = "/api/v1/webhooks/" + s.getId() + "?token=" + webhookToken;
        }

        return new SourceResponse(
                s.getId(), name, s.getType(), channel, s.isEnabled(),
                path, apiKeyHeader, apiKeyOnce, webhookToken, mapping, s.getCreatedAt());
    }

    private static String normalizeChannel(String channel) {
        if (channel == null) return "GENERIC";
        return switch (channel.toUpperCase().replaceAll("[\\s_\\-]", "")) {
            case "INSTAGRAM", "INSTA", "IG" -> "INSTAGRAM";
            case "GOOGLEFORM", "GOOGLE", "GFORM" -> "GOOGLE_FORM";
            default -> "GENERIC";
        };
    }

    private static String randomToken(int bytes) {
        byte[] b = new byte[bytes];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
