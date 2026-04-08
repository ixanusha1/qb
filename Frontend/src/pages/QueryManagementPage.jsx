import React, { useEffect } from "react";
import { initQueryManagementPage } from "../legacy/query-management.js";

export default function QueryManagementPage() {
  useEffect(() => {
    initQueryManagementPage();
  }, []);

  return (
    <div className="container">
      <div className="page-title-row">
        <h1 className="page-title">Query Management</h1>
        <button className="btn btn-success" id="openQueryModalBtn">
          ADD
        </button>
      </div>

      <div className="card">
        <div className="builder-toggle" id="builderToggle">
          <span className="toggle-icon">&gt;</span>
          <span className="builder-title">Visual Query Builder</span>
          <span className="builder-subtitle">- build a query without writing SQL</span>
        </div>

        <div className="builder-body" id="builderBody">
          <div id="builderAlert" className="alert"></div>

          <div className="builder-section">
            <div className="builder-section-title">
              <span className="builder-section-badge">1</span>
              Select Connection
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="builderDbType">Database Type</label>
                <select id="builderDbType">
                  <option value="">-- Select DB Type --</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="builderConnection">Connection</label>
                <select id="builderConnection" disabled>
                  <option value="">-- Select DB Type first --</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="builder-section"
            id="builderStep2"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            <div className="builder-section-title">
              <span className="builder-section-badge">2</span>
              Select Table
            </div>
            <div className="form-group" style={{ margin: 0, maxWidth: 300 }}>
              <select id="builderTable">
                <option value="">-- Select a connection first --</option>
              </select>
            </div>
          </div>

          <div
            className="builder-section"
            id="builderStep3"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            <div className="builder-section-title">
              <span className="builder-section-badge">3</span>
              Select Columns
              <span className="builder-section-note">
                (leave all unchecked to select *)
              </span>
            </div>
            <div className="column-checkboxes" id="columnCheckboxes">
              <span className="builder-placeholder">
                Select a table to see columns
              </span>
            </div>
          </div>

          <div
            className="builder-section"
            id="builderStep4"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            <div className="builder-section-title">
              <span className="builder-section-badge">4</span>
              Add JOIN
              <span className="builder-section-note">(optional)</span>
            </div>
            <div id="joinRows"></div>
            <button className="add-row-btn" id="addJoinBtn">
              + Add JOIN
            </button>
          </div>

          <div
            className="builder-section"
            id="builderStep5"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            <div className="builder-section-title">
              <span className="builder-section-badge">5</span>
              Add WHERE Conditions
              <span className="builder-section-note">(optional)</span>
            </div>
            <div id="whereRows"></div>
            <button className="add-row-btn" id="addWhereBtn">
              + Add Condition
            </button>
          </div>

          <div
            className="builder-section"
            id="builderStep6"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            <div className="builder-section-title">
              <span className="builder-section-badge">6</span>
              Generated SQL
            </div>
            <div className="generated-sql-box" id="generatedSql">
              Select a table to generate SQL...
            </div>
            <div className="btn-group" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" id="useQueryBtn">
                Use This Query
              </button>
              <button className="btn btn-secondary" id="resetBuilderBtn">
                Reset Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-overlay" id="queryModalOverlay">
        <div className="modal-card query-modal">
          <div className="modal-header">
            <h3 className="modal-title">Add New Query</h3>
            <button className="modal-close" id="queryModalCloseBtn">
              x
            </button>
          </div>

          <div id="formAlert" className="alert"></div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label htmlFor="queryName">Query Name</label>
              <input
                type="text"
                id="queryName"
                placeholder="e.g. All Employees"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dbType">Database Type</label>
              <select id="dbType">
                <option value="">-- Select Type --</option>
              </select>
            </div>
            <div
              className="form-group"
              id="testConnectionGroup"
              style={{ display: "none" }}
            >
              <label htmlFor="testConnection">
                Test Connection
                <span className="form-hint">- required for test run</span>
              </label>
              <select id="testConnection">
                <option value="">-- Select Connection --</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows="3"
              placeholder="e.g. Fetches all records from employees table"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="queryText">SQL Query</label>
            <textarea
              id="queryText"
              rows="5"
              placeholder="e.g. SELECT * FROM employees"
            ></textarea>
          </div>

          <div className="btn-group">
            <button className="btn btn-success fade-toggle" id="testRunBtn" disabled>
              Run Test
            </button>
            <button className="btn btn-secondary fade-toggle" id="clearBtn">
              Clear
            </button>
          </div>

          <div className="test-run-area" id="testRunArea" style={{ display: "none" }}>
            <div className="test-run-title">Test Run Results</div>

            <div id="testRunAlert" className="alert"></div>
            <div id="testRunSpinner" className="spinner">
              Running test query...
            </div>

            <div className="test-run-summary" id="testRunSummary"></div>

            <div
              className="table-wrapper"
              id="testRunTableWrapper"
              style={{ display: "none" }}
            >
              <table>
                <thead id="testRunTableHead"></thead>
                <tbody id="testRunTableBody"></tbody>
              </table>
            </div>

            <div
              id="testRunEmptyState"
              className="empty-state"
              style={{ display: "none" }}
            >
              Query returned no results.
            </div>

            <div
              className="pagination"
              id="testRunPagination"
              style={{ display: "none" }}
            >
              <button id="testRunPrevBtn" disabled>
                Prev
              </button>
              <span id="testRunPageInfo"></span>
              <button id="testRunNextBtn">Next</button>
            </div>

            <div className="btn-group" style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary fade-toggle is-hidden"
                id="saveQueryBtn"
              >
                Save Query
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
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
    </div>
  );
}
