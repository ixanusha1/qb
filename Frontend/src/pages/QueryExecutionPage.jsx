import React, { useEffect } from "react";
import { initQueryExecutionPage } from "../legacy/query-execution.js";

export default function QueryExecutionPage() {
  useEffect(() => {
    initQueryExecutionPage();
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Query Execution</h1>

      <div className="card">
        <div className="scratchpad-toggle" id="scratchpadToggle">
          <span className="toggle-icon">&gt;</span>
          <span className="scratchpad-title">Temp Query Scratchpad</span>
          <span className="scratchpad-subtitle">- test any query without saving</span>
        </div>

        <div className="scratchpad-body" id="scratchpadBody">
          <div id="scratchpadAlert" className="alert"></div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scratchDbType">Database Type</label>
              <select id="scratchDbType">
                <option value="">-- Select DB Type --</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="scratchConnection">Connection</label>
              <select id="scratchConnection" disabled>
                <option value="">-- Select DB Type first --</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="scratchQuery">SQL Query</label>
            <textarea
              id="scratchQuery"
              rows="4"
              placeholder="e.g. SELECT * FROM employees WHERE department = 'Engineering'"
            ></textarea>
          </div>

          <div className="inline-row">
            <button className="btn btn-success" id="scratchRunBtn" disabled>
              Run Temp Query
            </button>
            <button className="btn btn-secondary" id="scratchClearBtn">
              Clear
            </button>
            <div className="form-group inline-field">
              <label>Rows per page</label>
              <select
                id="scratchPageSize"
                className="page-size-select"
                defaultValue="50"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div id="scratchResultsArea" style={{ marginTop: 20, display: "none" }}>
            <div id="scratchSummary" className="summary-text"></div>
            <div id="scratchSpinner" className="spinner">
              Running query...
            </div>
            <div
              className="table-wrapper"
              id="scratchTableWrapper"
              style={{ display: "none" }}
            >
              <table>
                <thead id="scratchTableHead"></thead>
                <tbody id="scratchTableBody"></tbody>
              </table>
            </div>
            <div
              id="scratchEmptyState"
              className="empty-state"
              style={{ display: "none" }}
            >
              Query returned no results.
            </div>
            <div
              className="pagination"
              id="scratchPagination"
              style={{ display: "none" }}
            >
              <button id="scratchPrevBtn" disabled>
                Prev
              </button>
              <span id="scratchPageInfo"></span>
              <button id="scratchNextBtn">Next</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" id="savedQueriesCard">
        <h2 className="card-title">Saved Queries</h2>

        <div className="saved-queries-row">
          <div className="search-wrapper saved-search">
            <span className="search-icon">S</span>
            <input
              type="text"
              id="savedSearchInput"
              placeholder="Search by name, description, DB type, or connection..."
              autoComplete="off"
            />
          </div>
        </div>

        <div className="search-count" id="savedSearchCount"></div>

        <div id="savedTableAlert" className="alert"></div>
        <div id="savedTableSpinner" className="spinner">
          Loading queries...
        </div>

        <div
          className="table-wrapper"
          id="savedTableWrapper"
          style={{ display: "none" }}
        >
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>DB Type</th>
                <th>Execution Connection</th>
                <th>Query Preview</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="savedQueryTableBody"></tbody>
          </table>
        </div>

        <div
          id="savedEmptyState"
          className="empty-state"
          style={{ display: "none" }}
        >
          No queries found.
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Select and Execute</h2>

        <div className="steps">
          <div className="step active" id="step1Indicator">
            <div className="step-circle">1</div>
            <div className="step-label">DB Type</div>
          </div>
          <div className="step-line" id="line1"></div>
          <div className="step" id="step2Indicator">
            <div className="step-circle">2</div>
            <div className="step-label">Connection</div>
          </div>
          <div className="step-line" id="line2"></div>
          <div className="step" id="step3Indicator">
            <div className="step-circle">3</div>
            <div className="step-label">Query</div>
          </div>
        </div>

        <div id="executionAlert" className="alert"></div>

        <div className="form-group">
          <label htmlFor="dbTypeSelect">Step 1 - Select Database Type</label>
          <select id="dbTypeSelect">
            <option value="">-- Select DB Type --</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="connectionSelect">Step 2 - Select Connection</label>
          <select id="connectionSelect" disabled>
            <option value="">-- Select a DB Type first --</option>
          </select>
        </div>

        <div className="form-group">
          <label>Step 3 - Search and Select Query</label>
          <div className="search-wrapper" id="querySearchWrapper">
            <span className="search-icon">S</span>
            <input
              type="text"
              id="querySearchInput"
              placeholder="Select a connection first..."
              disabled
              autoComplete="off"
            />
            <div className="search-results" id="querySearchResults"></div>
          </div>

          <div className="selected-query-badge" id="selectedQueryBadge">
            <span>File</span>
            <span className="badge-name" id="selectedQueryName"></span>
            <button className="badge-clear" id="clearQueryBtn" title="Clear selection">
              x
            </button>
          </div>
        </div>

        <div id="queryPreviewBox" style={{ display: "none" }}>
          <div className="form-group">
            <label>Query Preview</label>
            <div className="query-preview" id="queryPreview"></div>
          </div>
          <div id="queryDescriptionText" className="query-description"></div>
        </div>

        <div className="inline-row">
          <div className="form-group inline-field">
            <label>Rows per page</label>
            <select
              id="pageSizeSelect"
              className="page-size-select"
              defaultValue="50"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <button className="btn btn-success" id="executeBtn" disabled>
            Execute Query
          </button>
          <button className="btn btn-secondary" id="resetBtn">
            Reset
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
