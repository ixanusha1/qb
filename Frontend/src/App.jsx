import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import DbConfigPage from "./pages/DbConfigPage.jsx";
import QueryManagementPage from "./pages/QueryManagementPage.jsx";
import QueryExecutionPage from "./pages/QueryExecutionPage.jsx";
import QueryResultsPage from "./pages/QueryResultsPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";

function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive ? "active" : undefined;

  return (
    <nav className="navbar">
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
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<DbConfigPage />} />
        <Route path="/queries" element={<QueryManagementPage />} />
        <Route path="/execute" element={<QueryExecutionPage />} />
        <Route path="/query-results" element={<QueryResultsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Routes>
    </div>
  );
}
