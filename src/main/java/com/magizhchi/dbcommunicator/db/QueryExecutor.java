package com.magizhchi.dbcommunicator.db;

import com.magizhchi.dbcommunicator.config.QueryProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

@Component
public class QueryExecutor {

    private static final Logger log = LoggerFactory.getLogger(QueryExecutor.class);

    private final ConnectionManager connectionManager;
    private final QueryProperties props;

    public QueryExecutor(ConnectionManager connectionManager, QueryProperties props) {
        this.connectionManager = connectionManager;
        this.props = props;
    }

    public QueryResult execute(String sql) {
        if (!connectionManager.isConnected()) {
            throw new IllegalStateException("Not connected to a database");
        }
        DataSource ds = connectionManager.dataSource();
        long start = System.currentTimeMillis();

        try (Connection c = ds.getConnection();
             Statement stmt = c.createStatement()) {

            stmt.setQueryTimeout(props.getTimeoutSeconds());
            stmt.setMaxRows(props.getMaxRows());

            boolean hasResultSet = stmt.execute(sql);
            long elapsed = System.currentTimeMillis() - start;

            if (hasResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    return readResultSet(rs, elapsed);
                }
            } else {
                int updates = stmt.getUpdateCount();
                log.info("Executed update in {}ms, {} row(s) affected", elapsed, updates);
                return QueryResult.updateCount(updates, elapsed);
            }
        } catch (Exception e) {
            throw new ExecutionException(e.getMessage(), e);
        }
    }

    private QueryResult readResultSet(ResultSet rs, long elapsed) throws Exception {
        ResultSetMetaData meta = rs.getMetaData();
        int colCount = meta.getColumnCount();

        List<String> columns = new ArrayList<>(colCount);
        for (int i = 1; i <= colCount; i++) {
            columns.add(meta.getColumnLabel(i));
        }

        List<List<Object>> rows = new ArrayList<>();
        int maxRows = props.getMaxRows();
        int row = 0;
        boolean truncated = false;
        while (rs.next()) {
            if (row >= maxRows) {
                truncated = true;
                break;
            }
            List<Object> r = new ArrayList<>(colCount);
            for (int i = 1; i <= colCount; i++) {
                r.add(rs.getObject(i));
            }
            rows.add(r);
            row++;
        }
        log.info("Executed query in {}ms, {} row(s){}", elapsed, rows.size(), truncated ? " (truncated)" : "");
        return QueryResult.resultSet(columns, rows, elapsed, truncated);
    }

    public static class ExecutionException extends RuntimeException {
        public ExecutionException(String message, Throwable cause) { super(message, cause); }
    }
}
