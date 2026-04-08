import { executeQuery, getQueryById } from "./api.js";

let currentPage = 0;
let currentPageSize = 50;
let totalPages = 0;
let queryId = null;
let configId = null;

let resultsAlert;
let queryMeta;
let querySql;
let resultsCard;
let resultsSpinner;
let resultsTableWrapper;
let resultsTableHead;
let resultsTableBody;
let resultsEmptyState;
let resultSummary;
let pagination;
let prevBtn;
let nextBtn;
let pageInfo;
let backToExecutionBtn;

function showAlert(message, type) {
  resultsAlert.textContent = message;
  resultsAlert.className = `alert ${type} show`;
}

function hideAlert() {
  resultsAlert.className = "alert";
  resultsAlert.textContent = "";
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  queryId = parseInt(params.get("queryId"), 10);
  configId = parseInt(params.get("configId"), 10);
  const size = parseInt(params.get("pageSize"), 10);
  currentPage = 0;
  totalPages = 0;
  currentPageSize = Number.isFinite(size) && size > 0 ? size : 50;
}

async function loadQueryMeta() {
  try {
    const query = await getQueryById(queryId);
    if (query && query.queryId) {
      queryMeta.innerHTML = `
        <div><span class="meta-label">Name:</span> ${query.name}</div>
        <div><span class="meta-label">DB Type:</span> ${query.dbType}</div>
        <div><span class="meta-label">Query ID:</span> ${query.queryId}</div>
        <div><span class="meta-label">Connection ID:</span> ${configId}</div>
        <div><span class="meta-label">Description:</span> ${query.description || "-"}</div>
      `;
      querySql.textContent = query.queryText || "";
    } else {
      queryMeta.innerHTML = `
        <div><span class="meta-label">Query ID:</span> ${queryId}</div>
        <div><span class="meta-label">Connection ID:</span> ${configId}</div>
      `;
      querySql.textContent = "";
    }
  } catch (err) {
    queryMeta.innerHTML = `
      <div><span class="meta-label">Query ID:</span> ${queryId}</div>
      <div><span class="meta-label">Connection ID:</span> ${configId}</div>
    `;
    querySql.textContent = "";
  }
}

async function runExecution() {
  if (!queryId || !configId) {
    showAlert(
      "Missing query or connection details. Return to Execute and try again.",
      "alert-error"
    );
    return;
  }

  hideAlert();
  resetResults();

  resultsCard.style.display = "block";
  resultsSpinner.classList.add("show");
  resultsTableWrapper.style.display = "none";
  resultsEmptyState.style.display = "none";
  pagination.style.display = "none";

  try {
    const result = await executeQuery({
      queryId: queryId,
      configId: configId,
      page: currentPage,
      pageSize: currentPageSize
    });

    const errorMessage = result.error || result.message;
    if (errorMessage) {
      showAlert(errorMessage, "alert-error");
      resultsCard.style.display = "none";
      return;
    }

    totalPages = result.totalPages;

    resultSummary.innerHTML = `
      <span><strong>Total Rows:</strong> ${result.totalRows}</span>
      <span><strong>Page:</strong> ${result.page + 1} of ${result.totalPages}</span>
      <span><strong>Columns:</strong> ${result.columns.length}</span>
    `;

    if (!result.rows || result.rows.length === 0) {
      resultsEmptyState.style.display = "block";
    } else {
      renderTable(resultsTableHead, resultsTableBody, result.columns, result.rows);
      resultsTableWrapper.style.display = "block";
    }

    if (result.totalPages > 1) {
      updatePagination(result.page, result.totalPages);
      pagination.style.display = "flex";
    }
  } catch (err) {
    showAlert("Execution failed. Please try again.", "alert-error");
    resultsCard.style.display = "none";
  } finally {
    resultsSpinner.classList.remove("show");
  }
}

function renderTable(thead, tbody, columns, rows) {
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  tbody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      if (cell === "NULL") {
        td.innerHTML = '<span style="color:#999;font-style:italic;">NULL</span>';
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function updatePagination(page, total) {
  pageInfo.textContent = `Page ${page + 1} of ${total}`;
  prevBtn.disabled = page === 0;
  nextBtn.disabled = page >= total - 1;
}

function resetResults() {
  resultsTableHead.innerHTML = "";
  resultsTableBody.innerHTML = "";
  resultsEmptyState.style.display = "none";
  resultsTableWrapper.style.display = "none";
  pagination.style.display = "none";
  resultSummary.innerHTML = "";
}

export function initQueryResultsPage() {
  resultsAlert = document.getElementById("resultsAlert");
  queryMeta = document.getElementById("queryMeta");
  querySql = document.getElementById("querySql");
  resultsCard = document.getElementById("resultsCard");
  resultsSpinner = document.getElementById("resultsSpinner");
  resultsTableWrapper = document.getElementById("resultsTableWrapper");
  resultsTableHead = document.getElementById("resultsTableHead");
  resultsTableBody = document.getElementById("resultsTableBody");
  resultsEmptyState = document.getElementById("resultsEmptyState");
  resultSummary = document.getElementById("resultSummary");
  pagination = document.getElementById("pagination");
  prevBtn = document.getElementById("prevBtn");
  nextBtn = document.getElementById("nextBtn");
  pageInfo = document.getElementById("pageInfo");
  backToExecutionBtn = document.getElementById("backToExecutionBtn");

  if (!resultsAlert) return;

  parseParams();
  loadQueryMeta().then(runExecution);

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      runExecution();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      runExecution();
    }
  });

  backToExecutionBtn.addEventListener("click", () => {
    window.location.href = "/execute";
  });
}
