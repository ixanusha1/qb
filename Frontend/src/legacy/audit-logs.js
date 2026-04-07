import { getAllAuditLogs } from "./api.js";

let filterDbType;
let refreshBtn;
let tableAlert;
let tableSpinner;
let tableWrapper;
let logsTableBody;
let emptyState;
let logSummary;
let modalOverlay;
let modalQueryText;
let modalCloseBtn;
let modalCloseBtnFooter;

function showAlert(message, type) {
  tableAlert.textContent = message;
  tableAlert.className = `alert ${type} show`;
}

function hideAlert() {
  tableAlert.className = "alert";
  tableAlert.textContent = "";
}

function populateFilterFromLogs(logs) {
  const existingValue = filterDbType.value;

  const types = [...new Set(logs.map((log) => log.dbType))].sort();

  filterDbType.innerHTML = '<option value="">-- All Types --</option>';

  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    filterDbType.appendChild(opt);
  });

  if (existingValue && types.includes(existingValue)) {
    filterDbType.value = existingValue;
  }
}

async function loadLogs() {
  tableSpinner.classList.add("show");
  tableWrapper.style.display = "none";
  emptyState.style.display = "none";
  logSummary.style.display = "none";
  hideAlert();

  try {
    const allLogs = await getAllAuditLogs();

    if (!Array.isArray(allLogs)) {
      showAlert("Failed to load audit logs.", "alert-error");
      return;
    }

    populateFilterFromLogs(allLogs);

    const selectedType = filterDbType.value;
    const logs = selectedType
      ? allLogs.filter((log) => log.dbType === selectedType)
      : allLogs;

    if (logs.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    logSummary.innerHTML = `
      ${logs.length} failure${logs.length > 1 ? "s" : ""} logged
      ${selectedType ? ` for <strong>${selectedType}</strong>` : " across all DB types"}.
    `;
    logSummary.style.display = "block";

    renderTable(logs);
    tableWrapper.style.display = "block";
  } catch (err) {
    showAlert("Failed to load audit logs. Is the backend running?", "alert-error");
  } finally {
    tableSpinner.classList.remove("show");
  }
}

function renderTable(logs) {
  logsTableBody.innerHTML = "";

  logs.forEach((log, index) => {
    const timestamp = log.timestamp
      ? new Date(log.timestamp).toLocaleString()
      : "-";

    const isLong = log.queryText && log.queryText.length > 60;
    const preview = isLong ? log.queryText.substring(0, 60) + "..." : log.queryText;

    const errorIsLong = log.errorMessage && log.errorMessage.length > 80;
    const errorPreview = errorIsLong
      ? log.errorMessage.substring(0, 80) + "..."
      : log.errorMessage;

    const row = document.createElement("tr");

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View full query";
    viewBtn.className = "link-button";
    viewBtn.addEventListener("click", () => openModal(log.queryText));

    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="white-space: nowrap;">${timestamp}</td>
      <td><span class="badge badge-error">${log.dbType}</span></td>
      <td>
        <code style="
          background: #f0f2f5;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #1e3a5f;
          display: block;
          max-width: 280px;
        ">${preview}</code>
      </td>
      <td style="color: #721c24; font-size: 13px; max-width: 300px;">
        ${errorPreview}
      </td>
    `;

    if (isLong) {
      row.querySelector("td:nth-child(4)").appendChild(viewBtn);
    }

    logsTableBody.appendChild(row);
  });
}

function openModal(queryText) {
  modalQueryText.textContent = queryText;
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";
  modalQueryText.textContent = "";
}

export function initAuditLogsPage() {
  filterDbType = document.getElementById("filterDbType");
  refreshBtn = document.getElementById("refreshBtn");
  tableAlert = document.getElementById("tableAlert");
  tableSpinner = document.getElementById("tableSpinner");
  tableWrapper = document.getElementById("tableWrapper");
  logsTableBody = document.getElementById("logsTableBody");
  emptyState = document.getElementById("emptyState");
  logSummary = document.getElementById("logSummary");
  modalOverlay = document.getElementById("modalOverlay");
  modalQueryText = document.getElementById("modalQueryText");
  modalCloseBtn = document.getElementById("modalCloseBtn");
  modalCloseBtnFooter = document.getElementById("modalCloseBtnFooter");

  if (!filterDbType) return;

  filterDbType.addEventListener("change", () => {
    loadLogs();
  });

  refreshBtn.addEventListener("click", () => {
    loadLogs();
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  modalCloseBtn.addEventListener("click", closeModal);
  modalCloseBtnFooter.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  loadLogs();
}
