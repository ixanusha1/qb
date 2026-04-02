package com.DSS.project.Service;

import com.DSS.project.DTO.ExecutionRequest;
import com.DSS.project.DTO.ExecutionResponse;
import com.DSS.project.Entity.DBConfig;
import com.DSS.project.Entity.SavedQuery;
import com.DSS.project.Exception.InvalidQueryException;
import com.DSS.project.Utility.AES;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
// To fetch configuration and query, connect, paginate, and perform execution
public class QueryExecutionService {

    private final DBConfigService dbConfigService;
    private final QueryService queryService;
    private final AuditLogService auditLogService;
    private final AES aesUtil;

    public ExecutionResponse execute(ExecutionRequest request) {

        // Default page and pageSize if not provided
        int page     = (request.getPage() != null)     ? request.getPage()     : 0;
        int pageSize = (request.getPageSize() != null) ? request.getPageSize() : 50;

        // Guard pagination values
        if (page < 0) {
            throw new InvalidQueryException("Page number cannot be negative.");
        }
        if (pageSize <= 0) {
            throw new InvalidQueryException("Page size must be greater than zero.");
        }
        if (pageSize > 500) {
            throw new InvalidQueryException("Page size cannot exceed 500 rows.");
        }

        // Step 1 — Fetch the saved query
        SavedQuery savedQuery = queryService.getQueryById(request.getQueryId());
        String queryText      = savedQuery.getQueryText();
        String dbType         = savedQuery.getDbType();

        if (!dbType.equalsIgnoreCase(request.getDbType())) {
            throw new InvalidQueryException(
                    "DB type mismatch. This query is saved for '" + dbType +
                            "' but request is for '" + request.getDbType() + "'."
            );
        }

        // Step 2 — Fetch the DB config for this db_type
        DBConfig config       = dbConfigService.getConfigByDbType(dbType);

        // Step 3 — Decrypt the password
        String decryptedPassword = aesUtil.decrypt(config.getPassword());

        // Step 4 — Build JDBC URL
        String url = dbConfigService.buildUrl(
                dbType, config.getHost(), config.getPort(), config.getDatabaseName()
        );

        // Step 5 — Execute with pagination
        try (Connection conn = DriverManager.getConnection(
                url, config.getUsername(), decryptedPassword)) {

            // 5a — Get total row count
            int totalRows = getTotalRowCount(conn, queryText);

            // 5b — Calculate total pages
            int totalPages = (int) Math.ceil((double) totalRows / pageSize);

            // Guard: page beyond available range
            if (totalRows > 0 && page >= totalPages) {
                throw new InvalidQueryException(
                        "Page " + page + " does not exist. " +
                                "Total pages available: " + totalPages + ".");
            }

            // 5c — Build paginated query
            String paginatedQuery = buildPaginatedQuery(queryText, dbType, page, pageSize);

            // 5d — Execute paginated query
            try (PreparedStatement stmt = conn.prepareStatement(paginatedQuery);
                 ResultSet rs           = stmt.executeQuery()) {

                ResultSetMetaData meta = rs.getMetaData();
                int columnCount        = meta.getColumnCount();

                // Extract column names
                List<String> columns = new ArrayList<>();
                for (int i = 1; i <= columnCount; i++) {
                    columns.add(meta.getColumnName(i));
                }

                // Extract rows
                List<List<String>> rows = new ArrayList<>();
                while (rs.next()) {
                    List<String> row = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String value = rs.getString(i);
                        row.add(value != null ? value : "NULL");
                    }
                    rows.add(row);
                }

                // Build and return response
                ExecutionResponse response = new ExecutionResponse();
                response.setColumns(columns);
                response.setRows(rows);
                response.setPage(page);
                response.setPageSize(pageSize);
                response.setTotalRows(totalRows);
                response.setTotalPages(totalPages);

                return response;
            }

        } catch (Exception e) {
            // Log failure to Audit DB
            auditLogService.logFailure(queryText, dbType, e.getMessage());
            throw new RuntimeException("Query execution failed: " + e.getMessage());
        }
    }

    // ── Helper: Get total row count for pagination calculation ──
    private int getTotalRowCount(Connection conn, String queryText) throws SQLException {
        String countQuery = "SELECT COUNT(*) FROM (" + queryText + ") AS count_result";
        try (PreparedStatement stmt = conn.prepareStatement(countQuery);
             ResultSet rs           = stmt.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    // ── Helper: Wrap query with correct pagination syntax per DB type ──
    private String buildPaginatedQuery(String queryText, String dbType,
                                       int page, int pageSize) {
        int offset = page * pageSize;

        return switch (dbType.toUpperCase()) {

            // MSSQL uses OFFSET / FETCH NEXT
            case "MSSQL" ->
                    "SELECT * FROM (" + queryText + ") AS paged_result " +
                            "ORDER BY (SELECT NULL) " +
                            "OFFSET " + offset + " ROWS " +
                            "FETCH NEXT " + pageSize + " ROWS ONLY";

            // MySQL and PostgreSQL use LIMIT / OFFSET
            case "MYSQL", "POSTGRESQL" ->
                    "SELECT * FROM (" + queryText + ") AS paged_result " +
                            "LIMIT " + pageSize + " OFFSET " + offset;

            default -> throw new RuntimeException("Unsupported DB type: " + dbType);
        };
    }
}
