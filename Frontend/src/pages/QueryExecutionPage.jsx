import React, { useEffect } from "react";
import { initQueryExecutionPage } from "../legacy/query-execution.js";

export default function QueryExecutionPage() {
  useEffect(() => {
    initQueryExecutionPage();
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Query Execution</h1>

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



      
    </div>
  );
}
