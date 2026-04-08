import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initQueryResultsPage } from "../legacy/query-results.js";

export default function QueryResultsPage() {
  const location = useLocation();

  useEffect(() => {
    initQueryResultsPage();
  }, [location.search]);

  return (
    <div className="container" key={location.search}>
      <h1 className="page-title">Query Results</h1>

      <div className="card">
        <h2 className="card-title">Executed Query</h2>

        <div id="resultsAlert" className="alert"></div>

        <div className="meta-grid" id="queryMeta"></div>
        <div className="sql-preview" id="querySql"></div>

        <div className="btn-group">
          <button className="btn btn-secondary" id="backToExecutionBtn">
            Back to Execute
          </button>
        </div>
      </div>

      <div className="card" id="resultsCard" style={{ display: "none" }}>
        <h2 className="card-title">Query Results</h2>

        <div id="resultSummary" className="summary-row"></div>

        <div id="resultsSpinner" className="spinner">
          Executing query...
        </div>

        <div
          className="table-wrapper"
          id="resultsTableWrapper"
          style={{ display: "none" }}
        >
          <table>
            <thead id="resultsTableHead"></thead>
            <tbody id="resultsTableBody"></tbody>
          </table>
        </div>

        <div
          id="resultsEmptyState"
          className="empty-state"
          style={{ display: "none" }}
        >
          Query returned no results.
        </div>

        <div className="pagination" id="pagination" style={{ display: "none" }}>
          <button id="prevBtn" disabled>
            Prev
          </button>
          <span id="pageInfo"></span>
          <button id="nextBtn">Next</button>
        </div>
      </div>
    </div>
  );
}
