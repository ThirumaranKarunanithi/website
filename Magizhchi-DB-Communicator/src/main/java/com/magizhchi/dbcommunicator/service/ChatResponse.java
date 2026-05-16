package com.magizhchi.dbcommunicator.service;

import com.magizhchi.dbcommunicator.ai.SqlSafetyAnalyzer.Analysis;
import com.magizhchi.dbcommunicator.db.QueryResult;

/**
 * One round-trip from the chat box: what the user said, what SQL the LLM generated,
 * the safety verdict, and (if executed) the query result.
 */
public record ChatResponse(
        String userMessage,
        String rawLlmResponse,
        String sql,
        String explanation,
        Analysis safety,
        QueryResult result,
        String errorMessage
) {
    public boolean hasSql() { return sql != null && !sql.isBlank(); }
    public boolean hasResult() { return result != null; }
    public boolean hasError() { return errorMessage != null && !errorMessage.isBlank(); }

    public static ChatResponse ofError(String userMessage, String error) {
        return new ChatResponse(userMessage, null, null, null, null, null, error);
    }
}
