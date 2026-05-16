package com.magizhchi.dbcommunicator.db;

import java.util.List;

public record QueryResult(
        Kind kind,
        List<String> columns,
        List<List<Object>> rows,
        int updateCount,
        long elapsedMillis,
        boolean truncated
) {
    public enum Kind { RESULT_SET, UPDATE_COUNT }

    public static QueryResult resultSet(List<String> columns, List<List<Object>> rows, long elapsedMillis, boolean truncated) {
        return new QueryResult(Kind.RESULT_SET, columns, rows, 0, elapsedMillis, truncated);
    }

    public static QueryResult updateCount(int count, long elapsedMillis) {
        return new QueryResult(Kind.UPDATE_COUNT, List.of(), List.of(), count, elapsedMillis, false);
    }
}
