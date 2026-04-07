import React, { useEffect } from "react";
import { initAuditLogsPage } from "../legacy/audit-logs.js";

export default function AuditLogsPage() {
  useEffect(() => {
    initAuditLogsPage();
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Audit Logs</h1>

      <div className="card">
        <h2 className="card-title">Filter Logs</h2>

        <div className="filter-row">
          <div className="form-group filter-field">
            <label htmlFor="filterDbType">Filter by DB Type</label>
            <select id="filterDbType">
              <option value="">-- All Types --</option>
            </select>
          </div>

          <button className="btn btn-secondary" id="refreshBtn">
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Failed Query Log</h2>

        <div id="logSummary" className="summary-text" style={{ display: "none" }}></div>

        <div id="tableAlert" className="alert"></div>

        <div id="tableSpinner" className="spinner">
          Loading audit logs...
        </div>

        <div className="table-wrapper" id="tableWrapper" style={{ display: "none" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>DB Type</th>
                <th>Query Text</th>
                <th>Error Message</th>
              </tr>
            </thead>
            <tbody id="logsTableBody"></tbody>
          </table>
        </div>

        <div id="emptyState" className="empty-state" style={{ display: "none" }}>
          <div className="empty-icon">OK</div>
          <div>No failures logged. Everything is running clean.</div>
        </div>
      </div>

      <div id="modalOverlay" className="modal-overlay">
        <div className="modal-card">
          <div className="modal-header">
            <h3 className="modal-title">Full Query Text</h3>
            <button id="modalCloseBtn" className="modal-close">
              x
            </button>
          </div>
          <pre id="modalQueryText" className="modal-body"></pre>
          <div className="modal-actions">
            <button className="btn btn-secondary" id="modalCloseBtnFooter">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
