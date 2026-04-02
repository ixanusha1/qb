// ── Base URL — change this if your backend runs on a different port ──
const BASE_URL = "http://localhost:8080/api";

// ─────────────────────────────────────────
// DB CONFIG APIs
// ─────────────────────────────────────────

async function testConnection(data) {
  const response = await fetch(`${BASE_URL}/db-config/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function saveDbConfig(data) {
  const response = await fetch(`${BASE_URL}/db-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function getAllDbConfigs() {
  const response = await fetch(`${BASE_URL}/db-config`);
  return response.json();
}

async function getAllDbTypes() {
  const response = await fetch(`${BASE_URL}/db-config/types`);
  return response.json();
}

async function deleteDbConfig(id) {
  const response = await fetch(`${BASE_URL}/db-config/${id}`, {
    method: "DELETE",
  });
  return response;
}

// ─────────────────────────────────────────
// QUERY APIs
// ─────────────────────────────────────────

async function saveQuery(data) {
  const response = await fetch(`${BASE_URL}/queries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function getAllQueries() {
  const response = await fetch(`${BASE_URL}/queries`);
  return response.json();
}

async function getQueriesByDbType(dbType) {
  const response = await fetch(`${BASE_URL}/queries/by-type?dbType=${dbType}`);
  return response.json();
}

async function deleteQuery(id) {
  const response = await fetch(`${BASE_URL}/queries/${id}`, {
    method: "DELETE",
  });
  return response;
}

// ─────────────────────────────────────────
// EXECUTION APIs
// ─────────────────────────────────────────

async function executeQuery(data) {
  const response = await fetch(`${BASE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

// ─────────────────────────────────────────
// AUDIT LOG APIs
// ─────────────────────────────────────────

async function getAllAuditLogs() {
  const response = await fetch(`${BASE_URL}/audit-logs`);
  return response.json();
}

async function getAuditLogsByDbType(dbType) {
  const response = await fetch(
    `${BASE_URL}/audit-logs/by-type?dbType=${dbType}`,
  );
  return response.json();
}
