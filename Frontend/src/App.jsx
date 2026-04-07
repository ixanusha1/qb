import React, { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import DbConfigPage from "./pages/DbConfigPage.jsx";
import QueryManagementPage from "./pages/QueryManagementPage.jsx";
import QueryExecutionPage from "./pages/QueryExecutionPage.jsx";
import QueryResultsPage from "./pages/QueryResultsPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";
import { initScratchpad } from "./legacy/scratchpad.js";

function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive ? "active" : undefined;

  return (
    <nav className="sidebar">
      <NavLink to="/" className="brand">
        Query Tool
      </NavLink>
      <ul className="nav-links">
        <li>
          <NavLink to="/" className={linkClass} end>
            DB Config
          </NavLink>
        </li>
        <li>
          <NavLink to="/queries" className={linkClass}>
            Queries
          </NavLink>
        </li>
        <li>
          <NavLink to="/execute" className={linkClass}>
            Execute
          </NavLink>
        </li>
        <li>
          <NavLink to="/audit-logs" className={linkClass}>
            Audit Logs
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default function App() {
  useEffect(() => {
    initScratchpad();
  }, []);

  return (
    <div className="app-shell" id="appShell">
      <div className="app-main">
        <Navbar />
        <Routes>
          <Route path="/" element={<DbConfigPage />} />
          <Route path="/queries" element={<QueryManagementPage />} />
          <Route path="/execute" element={<QueryExecutionPage />} />
          <Route path="/query-results" element={<QueryResultsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Routes>
      </div>

      <button className="fab" id="scratchpadFab" aria-label="Open scratchpad">
        <i className="fa-solid fa-bug" aria-hidden="true"></i>
      </button>

      <aside className="side-panel" id="scratchpadPanel" aria-hidden="true">
        <div className="side-panel-inner">
          <div className="side-panel-header">
            <h3 className="side-panel-title">Temp Query Scratchpad</h3>
            <button className="side-panel-close" id="scratchpadCloseBtn" aria-label="Close panel">
              x
            </button>
          </div>

          <div className="side-panel-content">
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
          </div>
        </div>
      </aside>

      <div className="modal-overlay scratch-results-overlay" id="scratchResultsOverlay">
        <div className="modal-card results-card">
          <div className="modal-header">
            <h3 className="modal-title">Temp Query Results</h3>
            <button className="modal-close" id="scratchResultsCloseBtn">x</button>
          </div>

          <div id="scratchResultsAlert" className="alert"></div>

          <div id="scratchResultsArea" style={{ display: "none" }}>
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
    </div>
  );
}
