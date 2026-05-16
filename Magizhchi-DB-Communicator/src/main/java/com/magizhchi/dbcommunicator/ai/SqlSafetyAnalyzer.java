package com.magizhchi.dbcommunicator.ai;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class SqlSafetyAnalyzer {

    private static final Pattern DROP = Pattern.compile("\\bDROP\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRUNCATE = Pattern.compile("\\bTRUNCATE\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ALTER = Pattern.compile("\\bALTER\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DELETE_NO_WHERE =
            Pattern.compile("\\bDELETE\\s+FROM\\b(?![\\s\\S]*\\bWHERE\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern UPDATE_NO_WHERE =
            Pattern.compile("\\bUPDATE\\b(?![\\s\\S]*\\bWHERE\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern MULTIPLE_STATEMENTS = Pattern.compile(";\\s*\\S");

    public Analysis analyze(String sql) {
        List<String> warnings = new ArrayList<>();
        Level level = Level.SAFE;

        if (sql == null || sql.isBlank()) {
            return new Analysis(Level.SAFE, List.of("Empty SQL"));
        }

        String normalized = sql.trim();
        if (normalized.endsWith(";")) normalized = normalized.substring(0, normalized.length() - 1);

        if (DROP.matcher(normalized).find()) {
            warnings.add("Contains DROP — schema will be removed.");
            level = Level.DESTRUCTIVE;
        }
        if (TRUNCATE.matcher(normalized).find()) {
            warnings.add("Contains TRUNCATE — all rows will be removed.");
            level = Level.DESTRUCTIVE;
        }
        if (ALTER.matcher(normalized).find()) {
            warnings.add("Contains ALTER — schema will be modified.");
            level = level == Level.DESTRUCTIVE ? Level.DESTRUCTIVE : Level.RISKY;
        }
        if (DELETE_NO_WHERE.matcher(normalized).find()) {
            warnings.add("DELETE without WHERE — will remove every row.");
            level = Level.DESTRUCTIVE;
        }
        if (UPDATE_NO_WHERE.matcher(normalized).find()) {
            warnings.add("UPDATE without WHERE — will modify every row.");
            level = level == Level.DESTRUCTIVE ? Level.DESTRUCTIVE : Level.RISKY;
        }
        if (MULTIPLE_STATEMENTS.matcher(normalized).find()) {
            warnings.add("Multiple statements detected — only the first will be executed.");
            level = level == Level.SAFE ? Level.RISKY : level;
        }

        return new Analysis(level, warnings);
    }

    public enum Level { SAFE, RISKY, DESTRUCTIVE }

    public record Analysis(Level level, List<String> warnings) {
        public boolean requiresConfirmation() {
            return level != Level.SAFE;
        }
    }
}
