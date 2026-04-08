import React, { useEffect } from "react";
import { initDbConfigPage } from "../legacy/db-config.js";

export default function DbConfigPage() {
  useEffect(() => {
    initDbConfigPage();
  }, []);

  return (
    <div className="container">
      <div className="page-title-row">
        <h1 className="page-title">Database Configuration</h1>
        <button className="btn btn-success" id="openConfigModalBtn">
          ADD
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">Saved Configurations</h2>

        <div id="tableAlert" className="alert"></div>

        <div id="tableSpinner" className="spinner">
          Loading configurations...
        </div>

        <div className="table-wrapper" id="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Config Name</th>
                <th>DB Type</th>
                <th>Host</th>
                <th>Port</th>
                <th>Database</th>
                <th>Username</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="configTableBody"></tbody>
          </table>
        </div>

        <div id="emptyState" className="empty-state" style={{ display: "none" }}>
          No configurations saved yet. Add one above.
        </div>
      </div>

      <div className="modal-overlay" id="configModalOverlay">
        <div className="modal-card config-modal">
          <div className="modal-header">
            <h3 className="modal-title">Add New Configuration</h3>
            <button className="modal-close" id="configModalCloseBtn">
              x
            </button>
          </div>

          <div id="formAlert" className="alert"></div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dbName">Configuration Name</label>
              <input type="text" id="dbName" placeholder="e.g. Local Client DB" />
            </div>
            <div className="form-group">
              <label htmlFor="dbType">Database Type</label>
              <select id="dbType">
                <option value="">-- Select Type --</option>
                <option value="MSSQL">MSSQL</option>
                <option value="MYSQL">MySQL</option>
                <option value="POSTGRESQL">PostgreSQL</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="host">Host</label>
              <input type="text" id="host" placeholder="e.g. localhost" />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input type="number" id="port" placeholder="e.g. 1433" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="databaseName">Database Name</label>
            <input type="text" id="databaseName" placeholder="e.g. client_db" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" placeholder="e.g. sa" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Enter password" />
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-secondary" id="testBtn">
              Test Connection
            </button>
            <button className="btn btn-primary" id="saveBtn" disabled>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
