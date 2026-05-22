package com.magizhchi.dbcommunicator.ai;

import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SqlExtractor {

    // Match any fenced code block — `sql`, `json`, `redis`, `text`, or no tag at all.
    private static final Pattern FENCED = Pattern.compile(
            "```\\s*[a-zA-Z0-9_-]*\\s*\\r?\\n([\\s\\S]*?)```", Pattern.MULTILINE);

    public Extracted extract(String llmResponse) {
        if (llmResponse == null || llmResponse.isBlank()) {
            return new Extracted("", llmResponse == null ? "" : llmResponse);
        }

        Matcher m = FENCED.matcher(llmResponse);
        if (m.find()) {
            String sql = m.group(1).trim();
            String explanation = (llmResponse.substring(0, m.start()) + llmResponse.substring(m.end()))
                    .replaceAll("\\s+", " ").trim();
            return new Extracted(sql, explanation);
        }

        // Fallback: assume the whole response is SQL if it starts with a SQL keyword.
        String trimmed = llmResponse.trim();
        if (looksLikeSql(trimmed)) {
            return new Extracted(trimmed, "");
        }
        return new Extracted("", trimmed);
    }

    private boolean looksLikeSql(String s) {
        String upper = s.toUpperCase();
        // SQL keywords.
        if (upper.startsWith("SELECT") || upper.startsWith("INSERT")
                || upper.startsWith("UPDATE") || upper.startsWith("DELETE")
                || upper.startsWith("WITH") || upper.startsWith("CREATE")
                || upper.startsWith("EXPLAIN")) {
            return true;
        }
        // NoSQL-looking payloads.
        // - Mongo runCommand / CouchDB Mango: starts with `{`.
        // - Redis: single command on one line, e.g. `HGETALL foo`.
        if (s.startsWith("{") && s.endsWith("}")) return true;
        String[] firstTok = s.split("\\s+", 2);
        return firstTok.length > 0 && firstTok[0].matches("[A-Z]+");
    }

    public record Extracted(String sql, String explanation) {}
}
