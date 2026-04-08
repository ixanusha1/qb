import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import DbConfigPage from "./pages/DbConfigPage.jsx";
import QueryManagementPage from "./pages/QueryManagementPage.jsx";
import QueryExecutionPage from "./pages/QueryExecutionPage.jsx";
import QueryResultsPage from "./pages/QueryResultsPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";
import { initScratchpad } from "./legacy/scratchpad.js";
import { getAllDbConfigs, getAllQueries } from "./legacy/api.js";

function Navbar() {
  const navigate = useNavigate();

  const [savedQueries, setSavedQueries] = useState([]);
  const [configsById, setConfigsById] = useState(new Map());
  const [showAllQueries, setShowAllQueries] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const sortedQueries = useMemo(() => {
    return [...savedQueries].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [savedQueries]);

  const filteredQueries = useMemo(() => {
    const term = sidebarSearch.trim().toLowerCase();
    if (!term) return sortedQueries;

    return sortedQueries.filter((query) => {
      const config = query.configId ? configsById.get(query.configId) : null;
      return [
        query.name,
        query.description,
        query.dbType,
        query.queryText,
        config?.dbName,
        config?.databaseName,
        config?.host
      ].some((value) => value && value.toLowerCase().includes(term));
    });
  }, [configsById, savedQueries, sidebarSearch, sortedQueries]);

  const visibleQueries = useMemo(() => {
    return showAllQueries ? filteredQueries : filteredQueries.slice(0, 7);
  }, [filteredQueries, showAllQueries]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedQueries() {
      try {
        const [queries, configs] = await Promise.all([
          getAllQueries(),
          getAllDbConfigs()
        ]);
        if (!isMounted) return;
        setSavedQueries(Array.isArray(queries) ? queries : []);
        const map = new Map();
        if (Array.isArray(configs)) {
          configs.forEach((config) => map.set(config.configId, config));
        }
        setConfigsById(map);
      } catch (err) {
        if (!isMounted) return;
        setSavedQueries([]);
        setConfigsById(new Map());
      }
    }

    loadSavedQueries();
    return () => {
      isMounted = false;
    };
  }, []);

  const runSavedQuery = async (query) => {
    if (!query?.configId) {
      return;
    }
    navigate(`/query-results?queryId=${query.queryId}&configId=${query.configId}&pageSize=50`);
  };

  return (
    <nav className="sidebar">
      <NavLink to="/" className="brand">
        Query Tool
      </NavLink>
      <div className="sidebar-queries">
        <div className="sidebar-section-title">Saved Queries</div>
        <div className="sidebar-search">
          <input
            type="text"
            value={sidebarSearch}
            onChange={(event) => setSidebarSearch(event.target.value)}
            placeholder="Search queries..."
          />
        </div>
        <div className="sidebar-query-list">
          {filteredQueries.length === 0 ? (
            <div className="sidebar-empty">No saved queries</div>
          ) : (
            visibleQueries.map((query) => {
              const config = query.configId ? configsById.get(query.configId) : null;
              const createdAt = query.createdAt
                ? new Date(query.createdAt).toLocaleDateString()
                : "N/A";

              return (
                <div
                  key={query.queryId}
                  className="sidebar-query-item"
                  title={query.name}
                >
                  <div className="sidebar-query-header">
                    <button
                      type="button"
                      className="sidebar-query-name"
                      onClick={() => runSavedQuery(query)}
                    >
                      {query.name}
                    </button>
                    <button
                      type="button"
                      className="sidebar-run-btn"
                      onClick={() => runSavedQuery(query)}
                    >
                      Run
                    </button>
                  </div>
                  <div className="sidebar-query-meta">
                    <span>Type: {query.dbType || "No DB type"}</span>
                    <span>Config: {config?.dbName || "No DB config"}</span>
                    <span>DB: {config?.databaseName || "Not linked"}</span>
                    <span>Host: {config?.host || "Not linked"}{config?.port ? `:${config.port}` : ""}</span>
                    <span>Created: {createdAt}</span>
                  </div>
                  <div className="sidebar-query-subtext">
                    {query.description || "No description"}
                  </div>
                  <div className="sidebar-query-subtext">
                    Query ID: {query.queryId}
                  </div>
                  <div className="sidebar-query-preview">
                    {query.queryText || "No SQL preview available"}
                  </div>
                </div>
              );
            })
          )}
          {filteredQueries.length > 7 ? (
            <button
              type="button"
              className="sidebar-query-more"
              onClick={() => setShowAllQueries((prev) => !prev)}
              aria-expanded={showAllQueries}
            >
              {showAllQueries ? "Hide" : "..."}
            </button>
          ) : null}
        </div>
      </div>

    </nav>
  );
}

function TopNav() {
  const linkClass = ({ isActive }) =>
    isActive ? "top-nav-link active" : "top-nav-link";

  return (
    <header className="top-nav">
      <div className="top-nav-links">
        <NavLink to="/" className={linkClass} end>
          DB Config
        </NavLink>
        <NavLink to="/queries" className={linkClass}>
          Report Config
        </NavLink>
        <NavLink to="/audit-logs" className={linkClass}>
          Audit Logs
        </NavLink>
      </div>
    </header>
  );
}

export default function App() {
  useEffect(() => {
    initScratchpad();
  }, []);

  return (
    <div className="app-shell" id="appShell">
      <div className="app-main">
        <TopNav />
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
