package com.magizhchi.dbcommunicator.service;

import com.magizhchi.dbcommunicator.ai.OllamaClient;
import com.magizhchi.dbcommunicator.ai.PromptBuilder;
import com.magizhchi.dbcommunicator.ai.SqlExtractor;
import com.magizhchi.dbcommunicator.ai.SqlSafetyAnalyzer;
import com.magizhchi.dbcommunicator.ai.SqlSafetyAnalyzer.Analysis;
import com.magizhchi.dbcommunicator.ai.SqlValidator;
import com.magizhchi.dbcommunicator.db.ConnectionManager;
import com.magizhchi.dbcommunicator.db.QueryExecutor;
import com.magizhchi.dbcommunicator.db.QueryResult;
import com.magizhchi.dbcommunicator.db.SchemaIntrospector;
import com.magizhchi.dbcommunicator.db.engine.DatabaseEngine;
import com.magizhchi.dbcommunicator.db.engine.EngineFamily;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the full natural-language-to-result pipeline:
 *   user message  ->  prompt  ->  LLM  ->  SQL extract  ->  safety check
 *                                          ->  (auto-run or wait for confirm)  ->  execute  ->  result
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ConnectionManager connectionManager;
    private final SchemaIntrospector schemaIntrospector;
    private final OllamaClient ollama;
    private final PromptBuilder promptBuilder;
    private final SqlExtractor sqlExtractor;
    private final SqlSafetyAnalyzer safetyAnalyzer;
    private final QueryExecutor queryExecutor;
    private final SqlValidator sqlValidator;

    public ChatService(ConnectionManager connectionManager,
                       SchemaIntrospector schemaIntrospector,
                       OllamaClient ollama,
                       PromptBuilder promptBuilder,
                       SqlExtractor sqlExtractor,
                       SqlSafetyAnalyzer safetyAnalyzer,
                       QueryExecutor queryExecutor,
                       SqlValidator sqlValidator) {
        this.connectionManager = connectionManager;
        this.schemaIntrospector = schemaIntrospector;
        this.ollama = ollama;
        this.promptBuilder = promptBuilder;
        this.sqlExtractor = sqlExtractor;
        this.safetyAnalyzer = safetyAnalyzer;
        this.queryExecutor = queryExecutor;
        this.sqlValidator = sqlValidator;
    }

    /**
     * Generate SQL/NoSQL query from the user's natural-language message. Does NOT execute.
     *
     * @param userMessage the natural language input
     * @param engine      the active engine (SQL or NoSQL); may be null pre-connect
     * @param dbType      display name of the engine flavor (e.g. "PostgreSQL", "MongoDB")
     * @param schema      schema snapshot from the engine; may be null pre-connect
     */
    public ChatResponse generate(String userMessage, DatabaseEngine engine,
                                 String dbType, SchemaIntrospector.SchemaSnapshot schema) {
        try {
            String prompt = promptBuilder.buildPrompt(engine, dbType, schema, userMessage);
            log.debug("Prompt sent to Ollama:\n{}", prompt);

            String raw = ollama.generate(prompt);
            SqlExtractor.Extracted extracted = sqlExtractor.extract(raw);

            // Client-side column validation (SQL engines only). If the LLM hallucinated
            // a column, retry once with the validator's correction feedback — avoids
            // wasting a DB round-trip on broken SQL.
            boolean isSql = engine == null || engine.family() == EngineFamily.SQL;
            if (isSql && schema != null) {
                List<SqlValidator.Issue> issues = sqlValidator.validate(extracted.sql(), schema);
                List<String> placeholders = sqlValidator.findPlaceholders(extracted.sql());
                if (!issues.isEmpty() || !placeholders.isEmpty()) {
                    String feedback = sqlValidator.formatFeedback(
                            issues, placeholders, extracted.sql(), schema);
                    log.info("SQL validation failed; retrying with feedback:\n{}", feedback);
                    String retryPrompt = promptBuilder.buildFixPrompt(
                            engine, dbType, schema, userMessage, extracted.sql(), feedback);
                    String retryRaw = ollama.generate(retryPrompt);
                    SqlExtractor.Extracted retried = sqlExtractor.extract(retryRaw);
                    if (retried.sql() != null && !retried.sql().isBlank()) {
                        raw = retryRaw;
                        extracted = retried;
                    }
                }
            }

            Analysis safety = safetyAnalyzer.analyze(extracted.sql());

            return new ChatResponse(userMessage, raw, extracted.sql(),
                    extracted.explanation(), safety, null, null);
        } catch (Exception e) {
            log.warn("generate() failed", e);
            return ChatResponse.ofError(userMessage, e.getMessage());
        }
    }

    /** Convenience overload that reads engine state from the legacy JDBC components. */
    public ChatResponse generate(String userMessage) {
        String dbType = connectionManager.getDbType();
        SchemaIntrospector.SchemaSnapshot schema =
                connectionManager.isConnected() ? schemaIntrospector.snapshot() : null;
        return generate(userMessage, null, dbType, schema);
    }

    /**
     * Run a SQL statement against the active connection.
     */
    public QueryResult execute(String sql) {
        return queryExecutor.execute(sql);
    }

    /** Engine-aware fix path. */
    public ChatResponse fixSql(String userMessage, String failedSql, String errorMessage,
                               DatabaseEngine engine, String dbType,
                               SchemaIntrospector.SchemaSnapshot schema) {
        try {
            String prompt = promptBuilder.buildFixPrompt(engine, dbType, schema, userMessage,
                    failedSql, errorMessage);
            log.debug("Fix prompt sent to Ollama:\n{}", prompt);

            String raw = ollama.generate(prompt);
            SqlExtractor.Extracted extracted = sqlExtractor.extract(raw);
            Analysis safety = safetyAnalyzer.analyze(extracted.sql());

            return new ChatResponse(userMessage, raw, extracted.sql(),
                    extracted.explanation(), safety, null, null);
        } catch (Exception e) {
            log.warn("fixSql() failed", e);
            return ChatResponse.ofError(userMessage, e.getMessage());
        }
    }

    /** Backward-compat overload — reads JDBC state. */
    public ChatResponse fixSql(String userMessage, String failedSql, String errorMessage) {
        String dbType = connectionManager.getDbType();
        SchemaIntrospector.SchemaSnapshot schema =
                connectionManager.isConnected() ? schemaIntrospector.snapshot() : null;
        return fixSql(userMessage, failedSql, errorMessage, null, dbType, schema);
    }
}
