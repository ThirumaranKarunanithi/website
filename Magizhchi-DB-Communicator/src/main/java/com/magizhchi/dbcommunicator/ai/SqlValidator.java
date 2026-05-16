package com.magizhchi.dbcommunicator.ai;

import com.magizhchi.dbcommunicator.db.SchemaIntrospector.ColumnInfo;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.TableInfo;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Lightweight client-side SQL validator. Detects column references in a
 * generated SQL string that don't actually exist in the connected schema,
 * and suggests the closest real column name from the same tables.
 *
 * <p>This is a heuristic — it uses regex tokenization instead of a full SQL
 * parser, so false positives are possible (e.g. column aliases, function
 * names with underscores). Use the result as a guide for retry-correction,
 * not as a strict gate.
 */
@Component
public class SqlValidator {

    /** SQL keywords and common functions that look like identifiers but aren't columns. */
    private static final Set<String> RESERVED = Set.of(
            "select","from","where","join","inner","left","right","outer","full","cross","on",
            "and","or","not","in","is","null","as","group","by","having","order","asc","desc",
            "limit","offset","case","when","then","else","end","with","distinct","union","all",
            "insert","into","values","update","set","delete","exists","between","like","ilike",
            "true","false","any","some",
            // common functions
            "count","sum","avg","min","max","coalesce","cast","convert","extract","date","year",
            "month","day","hour","minute","second","now","current_date","current_timestamp",
            "lower","upper","trim","length","substring","concat","abs","round","floor","ceil"
    );

    public List<Issue> validate(String sql, SchemaSnapshot schema) {
        if (sql == null || sql.isBlank() || schema == null || schema.tables().isEmpty()) {
            return List.of();
        }

        List<Issue> issues = new ArrayList<>();

        // ---- Step 0: validate every referenced table actually exists. ----
        Set<String> validTableNames = new HashSet<>();         // unqualified names
        Set<String> validTableNamesAndQualified = new HashSet<>();
        for (TableInfo t : schema.tables()) {
            validTableNames.add(t.name().toLowerCase(Locale.ROOT));
            validTableNamesAndQualified.add(t.name().toLowerCase(Locale.ROOT));
            validTableNamesAndQualified.add(t.qualifiedName().toLowerCase(Locale.ROOT));
        }
        for (String literal : extractLiteralTableRefs(sql)) {
            String low = literal.toLowerCase(Locale.ROOT);
            if (validTableNamesAndQualified.contains(low)) continue;
            int dot = low.lastIndexOf('.');
            String bare = dot >= 0 ? low.substring(dot + 1) : low;
            if (validTableNames.contains(bare)) continue;
            // Unknown table — suggest the closest match by edit distance.
            String suggestion = closestMatch(bare, validTableNames);
            issues.add(new Issue(literal, suggestion, Kind.TABLE));
        }
        // If any table is bogus, return early — column validation against a phantom
        // table is moot and would confuse the LLM retry.
        if (!issues.isEmpty()) return issues;

        // ---- Step 1: extract referenced tables (for column resolution). ----
        Set<String> tableRefs = extractTableRefs(sql);
        // Also pick up aliases: "FROM company_billing cb" → alias "cb" → "company_billing".
        Map<String, String> aliasToTable = extractAliases(sql);
        // Expose aliases to the bare-identifier scan so they aren't flagged as bogus columns.
        Set<String> tableRefsAndAliases = new HashSet<>(tableRefs);
        tableRefsAndAliases.addAll(aliasToTable.keySet());
        if (tableRefs.isEmpty() && aliasToTable.isEmpty()) return List.of();

        // ---- Step 2: gather valid columns across referenced tables. ----
        Map<String, Set<String>> tableColumns = new HashMap<>();
        Set<String> allValidColumns = new HashSet<>();
        for (TableInfo t : schema.tables()) {
            String tname = t.name().toLowerCase(Locale.ROOT);
            String qname = t.qualifiedName().toLowerCase(Locale.ROOT);
            if (tableRefs.contains(tname) || tableRefs.contains(qname)) {
                Set<String> cols = t.columns().stream()
                        .map(c -> c.name().toLowerCase(Locale.ROOT))
                        .collect(Collectors.toCollection(HashSet::new));
                tableColumns.put(tname, cols);
                tableColumns.put(qname, cols);
                allValidColumns.addAll(cols);
            }
        }
        // Map every known alias to its underlying table's columns.
        for (Map.Entry<String, String> entry : aliasToTable.entrySet()) {
            Set<String> cols = tableColumns.get(entry.getValue());
            if (cols != null) tableColumns.put(entry.getKey(), cols);
        }
        if (allValidColumns.isEmpty()) return List.of();

        // Step 3a: validate qualified column references (t.col syntax).
        Matcher qm = QUALIFIED_REF.matcher(sql);
        Set<String> qualifiedColsSeen = new HashSet<>();
        while (qm.find()) {
            String tableTok = qm.group(1).toLowerCase(Locale.ROOT);
            String colTok = qm.group(2);
            String colLower = colTok.toLowerCase(Locale.ROOT);

            Set<String> tableCols = tableColumns.get(tableTok);
            if (tableCols == null) continue;   // table not in our schema slice — skip
            qualifiedColsSeen.add(colLower);
            if (!tableCols.contains(colLower)) {
                String suggestion = closestMatch(colTok, tableCols);
                issues.add(new Issue(qm.group(1) + "." + colTok, suggestion));
            }
        }

        // Step 3b: validate bare identifiers (un-qualified column references).
        Set<String> suspicious = findSuspiciousIdentifiers(sql, allValidColumns, tableRefsAndAliases);
        for (String tok : suspicious) {
            if (qualifiedColsSeen.contains(tok.toLowerCase(Locale.ROOT))) continue;
            String suggestion = closestMatch(tok, allValidColumns);
            issues.add(new Issue(tok, suggestion));
        }
        return issues;
    }

    /**
     * Extract table aliases from FROM/JOIN clauses. E.g.
     * {@code FROM company_billing cb JOIN customer_details c ON …}
     * → returns {@code {"cb" → "company_billing", "c" → "customer_details"}}.
     */
    private Map<String, String> extractAliases(String sql) {
        Map<String, String> aliases = new HashMap<>();
        Matcher m = TABLE_WITH_ALIAS.matcher(sql);
        while (m.find()) {
            String table = m.group(1).replace("\"", "").toLowerCase(Locale.ROOT);
            String alias = m.group(2);
            if (alias == null) continue;
            String aliasLow = alias.toLowerCase(Locale.ROOT);
            // Don't treat SQL keywords as aliases — they'd never legitimately be aliases.
            if (RESERVED.contains(aliasLow)) continue;
            // Strip schema prefix from the table — we want the bare name plus the full one.
            int dot = table.lastIndexOf('.');
            String bare = dot >= 0 ? table.substring(dot + 1) : table;
            aliases.put(aliasLow, bare);
        }
        return aliases;
    }

    private static final Pattern TABLE_WITH_ALIAS = Pattern.compile(
            "\\b(?:FROM|JOIN|INTO|UPDATE)\\s+\"?([\\w.]+)\"?(?:\\s+(?:AS\\s+)?([a-zA-Z_][\\w]*))?",
            Pattern.CASE_INSENSITIVE);

    /** {@code t.col} pattern — captures the table-alias and the column separately. */
    private static final Pattern QUALIFIED_REF = Pattern.compile(
            "\\b([a-zA-Z_][\\w]*)\\.([a-zA-Z_][\\w]*)\\b");

    /** Format a list of issues as a feedback paragraph the LLM can read in a retry prompt. */
    public String formatFeedback(List<Issue> issues) {
        return formatFeedback(issues, List.of());
    }

    /** Two-way feedback: bogus columns AND any placeholder/template syntax. */
    public String formatFeedback(List<Issue> issues, List<String> placeholders) {
        return formatFeedback(issues, placeholders, null, null);
    }

    /**
     * Richest feedback: in addition to bogus columns and placeholders, also list
     * the actual columns of the table the LLM referenced. Stops it from "fixing"
     * an unknown column by inventing another from the same wrong table.
     */
    public String formatFeedback(List<Issue> issues, List<String> placeholders,
                                 String sql, SchemaSnapshot schema) {
        if (issues.isEmpty() && placeholders.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        if (!placeholders.isEmpty()) {
            sb.append("The previous SQL used placeholder syntax that is NOT valid SQL:\n");
            for (String p : placeholders) {
                sb.append("  - `").append(p).append("` is not a real value.\n");
            }
            sb.append("Rules:\n")
              .append("  - Do NOT use `<placeholder>` or `:name` or `${var}` patterns.\n")
              .append("  - Use a literal value when you have one (e.g. `1`, `'paid'`, `TRUE`).\n")
              .append("  - If you don't know a value, OMIT that WHERE clause entirely or use a sensible default.\n\n");
        }
        if (!issues.isEmpty()) {
            // Split issues by kind so the LLM sees table problems first (most fundamental).
            List<Issue> tableIssues = issues.stream().filter(i -> i.kind() == Kind.TABLE).toList();
            List<Issue> columnIssues = issues.stream().filter(i -> i.kind() == Kind.COLUMN).toList();

            if (!tableIssues.isEmpty()) {
                sb.append("The previous SQL referenced TABLES that do not exist in the schema:\n");
                for (Issue i : tableIssues) {
                    sb.append("  - `").append(i.invalidColumn).append("` is NOT a real table.");
                    if (i.suggestion != null) {
                        sb.append(" Did you mean `").append(i.suggestion).append("`?");
                    }
                    sb.append("\n");
                }
                if (schema != null) {
                    sb.append("\nAvailable tables (use the exact spelling shown):\n");
                    for (TableInfo t : schema.tables()) {
                        sb.append("  - ").append(t.qualifiedName()).append("\n");
                    }
                }
                sb.append("\n");
            }

            if (!columnIssues.isEmpty()) {
                sb.append("The previous SQL referenced columns that do not exist:\n");
                for (Issue i : columnIssues) {
                    sb.append("  - `").append(i.invalidColumn).append("` is NOT a column.");
                    if (i.suggestion != null) {
                        sb.append(" Did you mean `").append(i.suggestion).append("`?");
                    }
                    sb.append("\n");
                }

                // Append the actual columns of the referenced tables so the LLM has ground truth.
                if (sql != null && schema != null) {
                    Set<String> refs = extractTableRefs(sql);
                    if (!refs.isEmpty()) {
                        sb.append("\nThe ONLY columns that exist in the tables you referenced:\n");
                        for (TableInfo t : schema.tables()) {
                            String tn = t.name().toLowerCase(Locale.ROOT);
                            String qn = t.qualifiedName().toLowerCase(Locale.ROOT);
                            if (refs.contains(tn) || refs.contains(qn)) {
                                sb.append("  ").append(t.qualifiedName()).append(": ")
                                  .append(t.columns().stream()
                                          .map(c -> c.name())
                                          .collect(Collectors.joining(", ")))
                                  .append("\n");
                            }
                        }
                    }
                }
                sb.append("If none of the available columns fit the user's intent, return a SQL comment ")
                  .append("explaining what column is missing — do not invent one.\n");
            }
        }
        return sb.toString();
    }

    private static final Pattern PLACEHOLDER = Pattern.compile("<[a-zA-Z_][\\w\\- ]*>");

    /** Find {@code <placeholder>}-style template syntax that breaks parsing. */
    public List<String> findPlaceholders(String sql) {
        if (sql == null || sql.isBlank()) return List.of();
        List<String> out = new ArrayList<>();
        Matcher m = PLACEHOLDER.matcher(sql);
        while (m.find()) out.add(m.group());
        return out;
    }

    private static final Pattern TABLE_REF = Pattern.compile(
            "\\b(?:FROM|JOIN|INTO|UPDATE)\\s+\"?([\\w.\"]+)\"?",
            Pattern.CASE_INSENSITIVE);

    private Set<String> extractTableRefs(String sql) {
        Set<String> out = new HashSet<>();
        Matcher m = TABLE_REF.matcher(sql);
        while (m.find()) {
            String t = m.group(1).replace("\"", "").toLowerCase(Locale.ROOT);
            out.add(t);
            // Also store the unqualified name in case schema introspection didn't include the prefix.
            int dot = t.lastIndexOf('.');
            if (dot >= 0) out.add(t.substring(dot + 1));
        }
        return out;
    }

    private static final Pattern IDENT_TOKEN = Pattern.compile(
            "\\b([a-z_][a-z0-9_]*)\\b", Pattern.CASE_INSENSITIVE);

    private Set<String> findSuspiciousIdentifiers(String sql, Set<String> validColumns,
                                                  Set<String> tableRefs) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m = IDENT_TOKEN.matcher(sql);
        while (m.find()) {
            String raw = m.group(1);
            String tok = raw.toLowerCase(Locale.ROOT);

            if (RESERVED.contains(tok)) continue;
            if (tableRefs.contains(tok)) continue;
            if (validColumns.contains(tok)) continue;

            // Skip the column-part of a qualified reference (t.col) — that's already handled
            // by the table refs check, and we don't want to double-flag.
            int pos = m.start();
            if (pos > 0 && sql.charAt(pos - 1) == '.') continue;

            // Skip the table-part of a qualified reference (col before a `.col` is fine if the
            // identifier turns out to be a table alias; we can't tell without a real parser).
            int end = m.end();
            if (end < sql.length() && sql.charAt(end) == '.') continue;

            // Filter common short noise.
            if (tok.length() < 4) continue;

            // Heuristic: only flag if it really looks column-shaped (snake_case or compound noun
            // ≥ 6 chars). This keeps false positives down on things like `i` or `x` aliases.
            if (!tok.contains("_") && tok.length() < 6) continue;

            out.add(raw);
        }
        return out;
    }

    private String closestMatch(String target, Set<String> candidates) {
        String low = target.toLowerCase(Locale.ROOT);
        String best = null;
        int bestDist = Integer.MAX_VALUE;
        for (String c : candidates) {
            int d = levenshtein(low, c);
            if (d < bestDist) { bestDist = d; best = c; }
        }
        // Only suggest if the edit distance is plausible — half the length of the target,
        // capped at 5. Otherwise the "suggestion" is more confusing than helpful.
        int cap = Math.max(3, Math.min(5, target.length() / 2));
        return (best != null && bestDist <= cap) ? best : null;
    }

    private int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev; prev = curr; curr = tmp;
        }
        return prev[b.length()];
    }

    public enum Kind { TABLE, COLUMN }

    public record Issue(String invalidColumn, String suggestion, Kind kind) {
        public Issue(String invalidColumn, String suggestion) {
            this(invalidColumn, suggestion, Kind.COLUMN);
        }
    }

    /** Returns the literal text the user / LLM wrote after FROM/JOIN/etc. */
    private List<String> extractLiteralTableRefs(String sql) {
        List<String> out = new ArrayList<>();
        Matcher m = TABLE_REF.matcher(sql);
        while (m.find()) {
            out.add(m.group(1).replace("\"", ""));
        }
        return out;
    }
}
