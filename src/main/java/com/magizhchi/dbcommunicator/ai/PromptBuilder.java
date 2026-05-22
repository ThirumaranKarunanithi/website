package com.magizhchi.dbcommunicator.ai;

import com.magizhchi.dbcommunicator.db.SchemaIntrospector.ColumnInfo;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.SchemaSnapshot;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector.TableInfo;
import com.magizhchi.dbcommunicator.db.engine.DatabaseEngine;
import com.magizhchi.dbcommunicator.db.engine.EngineFamily;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class PromptBuilder {

    /** Words the keyword filter should ignore so we don't match on "for", "the" etc. */
    private static final Set<String> STOP_WORDS = Set.of(
            "the","a","an","for","and","or","of","in","on","with","by","to","from","as","is","are",
            "be","me","i","my","this","that","each","all","any","some","create","get","show","list",
            "give","find","fetch","please","report","records","data","details","information","mis",
            "count","amount","monthly","yearly","daily","every","total","into","using"
    );

    /** When the keyword filter narrows to fewer than this many tables, we include neighbours too. */
    private static final int MIN_RELEVANT_TABLES = 3;

    /** Engine-aware entry point. Picks SQL or NoSQL template based on engine family. */
    public String buildPrompt(DatabaseEngine engine, String dbType,
                              SchemaSnapshot schema, String userRequest) {
        if (engine == null || engine.family() == EngineFamily.SQL) {
            return buildSqlPrompt(dbType, schema, userRequest);
        }
        return buildNoSqlPrompt(engine, dbType, schema, userRequest);
    }

    public String buildFixPrompt(DatabaseEngine engine, String dbType, SchemaSnapshot schema,
                                 String userRequest, String failedSql, String errorMessage) {
        if (engine == null || engine.family() == EngineFamily.SQL) {
            return buildFixSqlPrompt(dbType, schema, userRequest, failedSql, errorMessage);
        }
        return buildNoSqlPrompt(engine, dbType, schema, userRequest)
                + "\n=== PREVIOUS ATTEMPT FAILED ===\n"
                + "Your previous " + engine.queryLanguageName() + ":\n"
                + "```\n" + failedSql + "\n```\n\n"
                + "Error: " + errorMessage + "\n\n"
                + "Generate a CORRECTED query. Use only fields/keys/collections shown in the schema.\n";
    }

    private String buildNoSqlPrompt(DatabaseEngine engine, String dbType,
                                    SchemaSnapshot schema, String userRequest) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert ").append(engine.queryLanguageName())
          .append(" assistant. The user is communicating with a ")
          .append(dbType).append(" database.\n\n");

        sb.append("=== AVAILABLE SCHEMA ===\n");
        if (schema != null && !schema.tables().isEmpty()) {
            sb.append("These are the ONLY collections/keys/fields you may reference.\n\n");
            for (TableInfo t : schema.tables()) {
                sb.append(t.qualifiedName()).append("\n  fields/keys: ")
                  .append(t.columns().stream()
                          .map(this::formatColumn)
                          .collect(Collectors.joining(", ")))
                  .append("\n");
            }
            sb.append("\n");
        } else {
            sb.append("(schema not yet loaded — ask the user to connect first)\n\n");
        }

        sb.append(engine.engineSpecificPromptRules()).append("\n");
        sb.append("=== USER REQUEST ===\n").append(userRequest).append("\n");
        return sb.toString();
    }

    public String buildSqlPrompt(String dbType, SchemaSnapshot schema, String userRequest) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert SQL assistant. The user is communicating with a ")
          .append(dbType).append(" database.\n\n");

        // If the user explicitly named a table ("...in company table", "from employees"),
        // surface that up-front so the LLM doesn't drift to a similar-named one.
        Set<String> explicit = schema == null
                ? Set.of()
                : detectExplicitTables(userRequest, schema.tables());
        if (!explicit.isEmpty()) {
            sb.append("=== USER NAMED THESE TABLES EXPLICITLY ===\n");
            for (String t : explicit) sb.append("  - ").append(t).append("\n");
            sb.append("You MUST use the tables above. DO NOT substitute a similar-named table\n");
            sb.append("(e.g. if the user said `company`, do NOT use `company_other_settings`).\n\n");
        }

        // If the user used a known business / analytics term, inject the canonical
        // definition + a template so the LLM doesn't have to guess the formula.
        List<String> hints = matchingDomainHints(userRequest);
        if (!hints.isEmpty()) {
            sb.append("=== DOMAIN HINTS (the user's terminology) ===\n");
            for (String h : hints) sb.append(h).append("\n");
        }

        sb.append("=== AVAILABLE SCHEMA ===\n");
        if (schema != null && !schema.tables().isEmpty()) {
            List<TableInfo> relevant = pickRelevantTables(schema.tables(), userRequest, explicit);
            int total = schema.tables().size();

            if (relevant.size() < total) {
                sb.append("Showing ").append(relevant.size()).append(" of ").append(total)
                  .append(" tables that look relevant to the user's request.\n");
            }
            sb.append("These are the ONLY tables and columns you may reference. Anything else does not exist.\n\n");
            for (TableInfo t : relevant) {
                sb.append(t.qualifiedName()).append("\n  columns: ")
                  .append(t.columns().stream()
                          .map(this::formatColumn)
                          .collect(Collectors.joining(", ")))
                  .append("\n");
            }
            sb.append("\n");

            // Redundant "permitted columns" list so the model has a flat reference at the bottom.
            sb.append("Permitted column names (must use one of these exact strings, qualified by table):\n");
            for (TableInfo t : relevant) {
                sb.append("  ").append(t.qualifiedName()).append(": ")
                  .append(t.columns().stream().map(c -> c.name()).collect(Collectors.joining(", ")))
                  .append("\n");
            }
            sb.append("\n");
        } else {
            sb.append("(schema not yet loaded — ask the user to connect first)\n\n");
        }

        sb.append("=== RULES ===\n");
        sb.append("1. Return EXACTLY ONE SQL query inside a fenced ```sql code block.\n");
        sb.append("2. After the code block, write 1-2 sentences explaining what the query does.\n");
        sb.append("3. Use ").append(dbType).append("-compatible syntax.\n");
        sb.append("4. CRITICAL: Use ONLY column names and table names that appear under AVAILABLE SCHEMA above.\n");
        sb.append("   Before writing each column, verify it appears in that table's 'columns:' list.\n");
        sb.append("   Do NOT invent column names like 'date_opened', 'created_at' etc. if they are not listed.\n");
        sb.append("4a. ENUM COLUMNS: when a column's type is followed by [val1|val2|...], you MUST use one of\n");
        sb.append("   those exact values in comparisons. E.g. column shown as 'status:bill_status[open|paid|cancelled]'\n");
        sb.append("   means valid values are 'open', 'paid', 'cancelled' — never invent values like 'closed'.\n");
        sb.append("5. If the user's request cannot be answered with the available columns, return a single-line\n");
        sb.append("   comment in the SQL block explaining what column is missing, e.g. ");
        sb.append("`-- Cannot answer: no date column found in company_billing`.\n");
        sb.append("6. Prefer JOINs over subqueries for related tables, using the listed columns.\n");
        sb.append("7. Do NOT include DROP, TRUNCATE, or ALTER unless the user explicitly asks for schema changes.\n");
        sb.append("8. For UPDATE/DELETE, always include a WHERE clause matching the user's intent.\n");
        sb.append("9. NEVER emit placeholder syntax such as `<value>`, `<user-id>`, `:name`, or `${var}`.\n");
        sb.append("   Use a literal (e.g. `1`, `'paid'`, `TRUE`), or OMIT the filter entirely if you\n");
        sb.append("   don't have a specific value. The query must be runnable as-is.\n\n");

        sb.append("=== USER REQUEST ===\n").append(userRequest).append("\n");
        return sb.toString();
    }

    /** Format a column for the prompt, appending {@code [val1|val2|...]} when it's an enum. */
    private String formatColumn(ColumnInfo c) {
        StringBuilder sb = new StringBuilder(c.name()).append(":").append(c.type());
        if (c.isEnum()) {
            sb.append("[").append(String.join("|", c.enumValues())).append("]");
        }
        return sb.toString();
    }

    /**
     * Keyword-based filter, with explicitly-mentioned tables forced to the top.
     */
    List<TableInfo> pickRelevantTables(List<TableInfo> all, String userRequest) {
        return pickRelevantTables(all, userRequest, detectExplicitTables(userRequest, all));
    }

    List<TableInfo> pickRelevantTables(List<TableInfo> all, String userRequest, Set<String> explicit) {
        if (all.size() <= MIN_RELEVANT_TABLES) return all;

        Set<String> keywords = extractKeywords(userRequest);

        // Score each table: explicit mention beats keyword match beats nothing.
        List<TableInfo> explicitMatches = new ArrayList<>();
        List<TableInfo> keywordMatches = new ArrayList<>();
        for (TableInfo t : all) {
            String name = t.name().toLowerCase();
            if (explicit.contains(name)) { explicitMatches.add(t); continue; }
            boolean tableHit = keywords.stream().anyMatch(name::contains);
            boolean columnHit = !tableHit && t.columns().stream()
                    .anyMatch(c -> {
                        String col = c.name().toLowerCase();
                        return keywords.stream().anyMatch(col::contains);
                    });
            if (tableHit || columnHit) keywordMatches.add(t);
        }

        List<TableInfo> ordered = new ArrayList<>(explicitMatches);
        ordered.addAll(keywordMatches);

        if (ordered.size() < MIN_RELEVANT_TABLES) return all;
        return ordered;
    }

    /**
     * Business / analytics terms we expand with canonical definitions and a
     * template query, so the LLM doesn't have to guess what "80/20" or
     * "cohort analysis" means. Pattern matched case-insensitively against the
     * user's prompt.
     */
    private record DomainHint(java.util.regex.Pattern pattern, String body) {
        static DomainHint of(String regex, String body) {
            return new DomainHint(
                    java.util.regex.Pattern.compile(regex, java.util.regex.Pattern.CASE_INSENSITIVE),
                    body);
        }
    }

    private static final List<DomainHint> DOMAIN_HINTS = List.of(
            DomainHint.of(
                    "80\\s*[/-]\\s*20|pareto|abc\\s+analysis|80\\s+class|20\\s+class",
                    """
                    PARETO / 80-20 / ABC ANALYSIS:
                    - Rank entities (customers, products, etc.) by a key metric (e.g. revenue, bill_amount, count).
                    - Compute the cumulative running sum and what percent of the grand-total it represents.
                    - 'Class A' / '80 class' = entities whose cumulative-% is ≤ 80 (they generate the top 80% of value).
                    - 'Class B' / '20 class' = the rest.

                    USE THIS EXACT SHAPE (don't invent variations):
                        WITH per_entity AS (
                          SELECT <id>, SUM(<metric>) AS total
                          FROM <table>
                          GROUP BY <id>
                        ),
                        with_cum AS (
                          SELECT *,
                                 SUM(total) OVER (ORDER BY total DESC) * 100.0
                                   / SUM(total) OVER () AS cumulative_pct
                          FROM per_entity
                        )
                        SELECT <id>, total, cumulative_pct,
                               CASE WHEN cumulative_pct <= 80
                                    THEN 'Class A (80)'
                                    ELSE 'Class B (20)'
                               END AS pareto_class
                        FROM with_cum
                        ORDER BY total DESC;

                    COMMON MISTAKES TO AVOID:
                    - Do NOT use PERCENTILE_CONT — that's percentile, not Pareto cumulative-share.
                    - Do NOT nest aggregates: `SUM(... AVG(...))` and `SUM(... (SELECT PERCENTILE_CONT(...) ...))`
                      are invalid in PostgreSQL ("aggregate function calls cannot be nested").
                    - Always go through a CTE — don't try to compute cumulative_pct inline in the outer SELECT.
                    """),
            DomainHint.of(
                    "\\bchurn\\b|attrition|retention",
                    """
                    CHURN / RETENTION:
                    - Customers who were active in one period but inactive in the next.
                    - Compare two date windows on a customer-activity table.
                    - Churn % = (active in period 1 but not in period 2) / (active in period 1) × 100.
                    - Retention % = 100 − churn %.
                    """),
            DomainHint.of(
                    "\\bcohort\\b",
                    """
                    COHORT ANALYSIS:
                    - Group customers by their first-activity month (the cohort).
                    - Track each cohort's behaviour across subsequent months.
                    - Output: rows = cohort_month, columns = month_offset, values = active customers.
                    """),
            DomainHint.of(
                    "month\\s*over\\s*month|year\\s*over\\s*year|\\bmom\\b|\\byoy\\b",
                    """
                    MONTH-OVER-MONTH / YEAR-OVER-YEAR GROWTH:
                    - Use LAG() over a date-ordered window to compare the current period with the previous.
                    - Growth % = (this_period − prev_period) / prev_period × 100.
                    """),
            DomainHint.of(
                    "running\\s+total|cumulative",
                    """
                    RUNNING TOTAL / CUMULATIVE SUM:
                    - SUM(<metric>) OVER (ORDER BY <date_or_id>) — gives row-level running totals.
                    """),
            DomainHint.of(
                    "rfm\\b|recency.*frequency.*monetary",
                    """
                    RFM ANALYSIS (Recency / Frequency / Monetary):
                    - For each customer compute three scores:
                        Recency  = days since last activity (lower is better)
                        Frequency = number of transactions in the window
                        Monetary  = sum of transaction amounts in the window
                    - Bucket each score into quintiles (NTILE(5)) and concatenate, e.g. 'R5F4M5'.
                    """)
    );

    /** Returns the bodies of every domain hint whose pattern matches the user request. */
    private List<String> matchingDomainHints(String userRequest) {
        if (userRequest == null || userRequest.isBlank()) return List.of();
        List<String> out = new ArrayList<>();
        for (DomainHint h : DOMAIN_HINTS) {
            if (h.pattern.matcher(userRequest).find()) out.add(h.body);
        }
        return out;
    }

    /**
     * Find table names that the user wrote literally in the request, e.g.
     * "in <code>company</code> table" → returns {"company"}. Word-boundary
     * matched so {@code company} doesn't match {@code company_other_settings}.
     */
    Set<String> detectExplicitTables(String userRequest, List<TableInfo> all) {
        if (userRequest == null || userRequest.isBlank() || all == null) return Set.of();
        String lower = userRequest.toLowerCase();
        Set<String> hits = new LinkedHashSet<>();
        for (TableInfo t : all) {
            String name = t.name().toLowerCase();
            if (name.length() < 3) continue;
            // word-boundary match — won't false-match `company` inside `company_other_settings`.
            if (java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(name) + "\\b")
                    .matcher(lower).find()) {
                hits.add(name);
            }
        }
        return hits;
    }

    private Set<String> extractKeywords(String userRequest) {
        if (userRequest == null) return Set.of();
        String[] tokens = userRequest.toLowerCase()
                .replaceAll("[^a-z0-9_\\s]", " ")
                .split("\\s+");
        Set<String> out = new HashSet<>();
        for (String tok : tokens) {
            if (tok.length() < 3) continue;
            if (STOP_WORDS.contains(tok)) continue;
            out.add(tok);
            // Also add singular form for trivial plurals so "bills" matches "bill".
            if (tok.endsWith("s") && tok.length() > 3) out.add(tok.substring(0, tok.length() - 1));
        }
        return out;
    }

    /**
     * Build a follow-up prompt asking the model to correct a SQL query that
     * failed at execution time. Includes the original request, the failed SQL,
     * and the database's actual error message.
     */
    public String buildFixSqlPrompt(String dbType, SchemaSnapshot schema, String userRequest,
                                    String failedSql, String errorMessage) {
        StringBuilder sb = new StringBuilder(buildSqlPrompt(dbType, schema, userRequest));
        sb.append("\n=== PREVIOUS ATTEMPT FAILED ===\n");
        sb.append("Your previous SQL:\n```sql\n").append(failedSql).append("\n```\n\n");
        sb.append("Error from ").append(dbType).append(":\n").append(errorMessage).append("\n");

        String targetedHint = hintForDbError(errorMessage);
        if (!targetedHint.isEmpty()) {
            sb.append("\n=== TARGETED HINT FOR THIS ERROR ===\n").append(targetedHint).append("\n");
        }

        sb.append("\n=== INSTRUCTIONS ===\n");
        sb.append("Generate a CORRECTED SQL query. Common causes:\n");
        sb.append("- The previous SQL referenced a column that doesn't exist in the schema above.\n");
        sb.append("  Re-read each table's 'columns:' list and use only those exact names.\n");
        sb.append("- The previous SQL used wrong syntax for ").append(dbType).append(".\n");
        sb.append("- A table name was incorrect or qualified wrong.\n\n");
        sb.append("Return the corrected query in a fenced ```sql block, then explain in 1-2 sentences ");
        sb.append("what you changed and why.\n");
        return sb.toString();
    }

    /**
     * Map common DB error messages to a targeted "here's what's actually wrong
     * and how to fix the SQL structure" hint. The LLM benefits from a plain-English
     * explanation more than the raw error code.
     */
    private String hintForDbError(String error) {
        if (error == null) return "";
        String low = error.toLowerCase();

        if (low.contains("aggregate function calls cannot be nested")) {
            return """
                You CANNOT put an aggregate inside another aggregate (e.g. SUM(... AVG(...) ...)).
                You also CANNOT put a correlated aggregate subquery inside an aggregate.

                Fix: compute the inner aggregate in a separate CTE first, then JOIN or
                cross-reference its result. Example pattern:

                    WITH stats AS (
                      SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY amount) AS p80
                      FROM company_billing
                    )
                    SELECT cb.customer_id,
                           SUM(CASE WHEN cb.amount > stats.p80 THEN 1 ELSE 0 END) AS top_count
                    FROM company_billing cb
                    CROSS JOIN stats
                    GROUP BY cb.customer_id;
                """;
        }
        if (low.contains("must appear in the group by clause")
                || low.contains("not a group by expression")
                || low.contains("only_full_group_by")) {
            return "Every non-aggregated column in the SELECT list MUST also appear in GROUP BY. "
                 + "Either add the missing columns to GROUP BY, or wrap them in an aggregate "
                 + "function like MAX() or MIN().";
        }
        if (low.contains("invalid input value for enum") || low.contains("invalid input syntax for type")) {
            return "The value you used isn't a valid member of that enum / type. "
                 + "Check the schema's enum values list (shown as `[val1|val2|...]` after the column type).";
        }
        if (low.contains("does not exist") && low.contains("column")) {
            return "The column you referenced isn't real. Re-read the schema and pick from the listed columns only.";
        }
        if (low.contains("does not exist") && (low.contains("relation") || low.contains("table"))) {
            return "The table you referenced isn't real. Re-read the AVAILABLE SCHEMA section above for "
                 + "the exact list of tables.";
        }
        if (low.contains("syntax error")) {
            return "Plain SQL syntax error — likely a misplaced keyword, unterminated string, "
                 + "or non-SQL token (e.g. <placeholder>, ObjectId()). Regenerate strict SQL.";
        }
        if (low.contains("division by zero")) {
            return "Wrap the denominator in NULLIF(denom, 0) so division by zero returns NULL instead of erroring.";
        }
        return "";
    }
}
