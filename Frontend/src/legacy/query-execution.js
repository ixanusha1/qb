import {
  executeQuery,
  executeTempQuery,
  getAllDbTypes,
  getAllQueries,
  getAllDbConfigs,
  getConfigsByDbType
} from "./api.js";

let selectedQueryId = null;
let selectedConfigId = null;
let selectedDbType = null;
let currentPage = 0;
let currentPageSize = 50;
let totalPages = 0;

let allQueriesForType = [];
let scratchPage = 0;
let scratchTotalPages = 0;
let scratchPageSize = 50;
let scratchConfigId = null;
let savedRows = [];

let dbTypeSelect;
let connectionSelect;
let querySearchInput;
let querySearchResults;
let selectedQueryBadge;
let selectedQueryName;
let clearQueryBtn;
let queryPreviewBox;
let queryPreview;
let queryDescriptionText;
let pageSizeSelect;
let executeBtn;
let resetBtn;
let executionAlert;
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

let savedSearchInput;
let savedTableAlert;
let savedTableSpinner;
let savedTableWrapper;
let savedQueryTableBody;
let savedEmptyState;
let savedSearchCount;

let step1Indicator;
let step2Indicator;
let step3Indicator;
let line1;
let line2;

let scratchpadToggle;
let scratchpadBody;
let scratchDbType;
let scratchConnection;
let scratchQuery;
let scratchRunBtn;
let scratchClearBtn;
let scratchPageSizeEl;
let scratchResultsArea;
let scratchSummary;
let scratchSpinner;
let scratchTableWrapper;
let scratchTableHead;
let scratchTableBody;
let scratchEmptyState;
let scratchPagination;
let scratchPrevBtn;
let scratchNextBtn;
let scratchPageInfo;
let scratchpadAlert;

function showAlert(message, type) {
  executionAlert.textContent = message;
  executionAlert.className = `alert ${type} show`;
}

function hideAlert() {
  executionAlert.className = "alert";
  executionAlert.textContent = "";
}

function showSavedAlert(message, type) {
  savedTableAlert.textContent = message;
  savedTableAlert.className = `alert ${type} show`;
}

function hideSavedAlert() {
  savedTableAlert.className = "alert";
  savedTableAlert.textContent = "";
}

function showScratchAlert(message, type) {
  scratchpadAlert.textContent = message;
  scratchpadAlert.className = `alert ${type} show`;
}

function hideScratchAlert() {
  scratchpadAlert.className = "alert";
  scratchpadAlert.textContent = "";
}

function updateSteps(completedSteps) {
  [step1Indicator, step2Indicator, step3Indicator].forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i < completedSteps) el.classList.add("done");
    else if (i === completedSteps) el.classList.add("active");
  });
  line1.classList.toggle("done", completedSteps >= 2);
  line2.classList.toggle("done", completedSteps >= 3);
}

async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();

    dbTypeSelect.innerHTML = '<option value="">-- Select DB Type --</option>';
    scratchDbType.innerHTML = '<option value="">-- Select DB Type --</option>';

    if (!Array.isArray(types) || types.length === 0) {
      showAlert(
        "No DB configurations found. Please add one on the DB Config page.",
        "alert-info"
      );
      return;
    }

    types.forEach((type) => {
      const opt1 = document.createElement("option");
      opt1.value = type;
      opt1.textContent = type;
      dbTypeSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = type;
      opt2.textContent = type;
      scratchDbType.appendChild(opt2);

    });
  } catch (err) {
    showAlert("Failed to load DB types. Is the backend running?", "alert-error");
  }
}

async function loadSavedQueries() {
  savedTableSpinner.classList.add("show");
  savedTableWrapper.style.display = "none";
  savedEmptyState.style.display = "none";
  hideSavedAlert();

  try {
    const [queries, configs] = await Promise.all([
      getAllQueries(),
      getAllDbConfigs()
    ]);
    savedRows = buildSavedRows(queries, configs);
    renderSavedTable(getSavedFilteredRows());
  } catch (err) {
    showSavedAlert("Failed to load queries.", "alert-error");
  } finally {
    savedTableSpinner.classList.remove("show");
  }
}

function buildSavedRows(queries, configs) {
  if (!Array.isArray(queries)) return [];
  const configsByType = new Map();

  if (Array.isArray(configs)) {
    configs.forEach((config) => {
      if (!configsByType.has(config.dbType)) {
        configsByType.set(config.dbType, []);
      }
      configsByType.get(config.dbType).push(config);
    });
  }

  const rows = [];
  queries.forEach((query) => {
    const configsForType = configsByType.get(query.dbType) || [];
    if (configsForType.length === 0) {
      rows.push({ query, config: null });
      return;
    }
    configsForType.forEach((config) => {
      rows.push({ query, config });
    });
  });

  return rows;
}

function getSavedFilteredRows() {
  const term = savedSearchInput.value.trim().toLowerCase();

  return savedRows.filter((row) => {
    const { query, config } = row;
    const matchesTerm = term
      ? query.name.toLowerCase().includes(term) ||
        (query.description && query.description.toLowerCase().includes(term)) ||
        query.dbType.toLowerCase().includes(term) ||
        (config && config.dbName && config.dbName.toLowerCase().includes(term))
      : true;
    return matchesTerm;
  });
}

function renderSavedTable(rows) {
  const term = savedSearchInput.value.trim().toLowerCase();

  savedQueryTableBody.innerHTML = "";

  savedSearchCount.textContent =
    rows.length === savedRows.length
      ? `${savedRows.length} rows total`
      : `Showing ${rows.length} of ${savedRows.length} rows`;

  if (rows.length === 0) {
    savedTableWrapper.style.display = "none";
    savedEmptyState.style.display = "block";
    savedEmptyState.textContent = term
      ? `No queries match "${term}".`
      : "No queries saved yet. Add one on Query Management.";
    return;
  }

  savedEmptyState.style.display = "none";
  savedTableWrapper.style.display = "block";

  rows.forEach((rowData, index) => {
    const { query, config } = rowData;
    const createdAt = query.createdAt
      ? new Date(query.createdAt).toLocaleString()
      : "-";

    const preview =
      query.queryText.length > 60
        ? query.queryText.substring(0, 60) + "..."
        : query.queryText;

    const highlightedName = term
      ? query.name.replace(
          new RegExp(`(${term})`, "gi"),
          '<span class="highlight">$1</span>'
        )
      : query.name;

    const description = query.description
      ? term
        ? query.description.replace(
            new RegExp(`(${term})`, "gi"),
            '<span class="highlight">$1</span>'
          )
        : query.description
      : '<span style="color:#999;">-</span>';

    const rowEl = document.createElement("tr");
    rowEl.className = "saved-query-row";
    rowEl.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${highlightedName}</strong></td>
      <td>${description}</td>
      <td><span class="badge badge-info">${query.dbType}</span></td>
      <td>${config ? config.dbName : "<span style='color:#999;'>No connection</span>"}</td>
      <td>
        <code style="
          background:#f0f2f5;
          padding:3px 8px;
          border-radius:4px;
          font-size:12px;
          color:#1e3a5f;
        ">${preview}</code>
      </td>
      <td>${createdAt}</td>
      <td>
        <button class="btn btn-success run-btn" style="padding:6px 14px;font-size:12px;">
          Run
        </button>
      </td>
    `;

    rowEl.addEventListener("click", () => handleSavedRowRun(rowData));
    savedQueryTableBody.appendChild(rowEl);
  });
}

function handleSavedRowRun(row) {
  hideSavedAlert();

  if (!row.config) {
    showSavedAlert(
      `No execution connection available for ${row.query.dbType}.`,
      "alert-info"
    );
    return;
  }

  const pageSize = parseInt(pageSizeSelect.value, 10) || 50;
  const url = `/query-results?queryId=${encodeURIComponent(
    row.query.queryId
  )}&configId=${encodeURIComponent(row.config.configId)}&pageSize=${encodeURIComponent(
    pageSize
  )}`;
  window.location.href = url;
}

function renderSearchResults(term) {
  querySearchResults.innerHTML = "";

  const filtered = term
    ? allQueriesForType.filter(
        (q) =>
          q.name.toLowerCase().includes(term) ||
          (q.description && q.description.toLowerCase().includes(term))
      )
    : allQueriesForType;

  if (filtered.length === 0) {
    querySearchResults.innerHTML = `<div class="search-no-results">No queries match "${term}"</div>`;
    querySearchResults.classList.add("open");
    return;
  }

  filtered.forEach((query) => {
    const item = document.createElement("div");
    item.className = "search-result-item";

    const highlightedName = term
      ? query.name.replace(
          new RegExp(`(${term})`, "gi"),
          '<span class="highlight">$1</span>'
        )
      : query.name;

    item.innerHTML = `
      <div class="query-name">${highlightedName}</div>
      ${query.description ? `<div class="query-desc">${query.description}</div>` : ""}
    `;

    item.addEventListener("click", () => selectQuery(query));
    querySearchResults.appendChild(item);
  });

  querySearchResults.classList.add("open");
}

function selectQuery(query) {
  selectedQueryId = query.queryId;

  selectedQueryName.textContent = query.name;
  selectedQueryBadge.classList.add("show");

  queryPreview.textContent = query.queryText;
  queryDescriptionText.textContent = query.description
    ? "Description: " + query.description
    : "";
  queryDescriptionText.style.display = query.description ? "block" : "none";
  queryPreviewBox.style.display = "block";

  querySearchInput.value = "";
  querySearchResults.classList.remove("open");

  executeBtn.disabled = false;
  updateSteps(3);
}

function resetQuerySelection() {
  selectedQueryId = null;
  selectedQueryBadge.classList.remove("show");
  selectedQueryName.textContent = "";
  queryPreviewBox.style.display = "none";
  queryPreview.textContent = "";
  queryDescriptionText.textContent = "";
  querySearchInput.value = "";
  querySearchResults.classList.remove("open");
  executeBtn.disabled = true;
  resetResults();
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
  resultsCard.style.display = "none";
  resultsTableHead.innerHTML = "";
  resultsTableBody.innerHTML = "";
  resultsEmptyState.style.display = "none";
  resultsTableWrapper.style.display = "none";
  pagination.style.display = "none";
  resultSummary.innerHTML = "";
}

function resetScratchResults() {
  scratchResultsArea.style.display = "none";
  scratchTableHead.innerHTML = "";
  scratchTableBody.innerHTML = "";
  scratchEmptyState.style.display = "none";
  scratchTableWrapper.style.display = "none";
  scratchPagination.style.display = "none";
  scratchSummary.innerHTML = "";
}

async function runExecution() {
  if (!selectedQueryId || !selectedConfigId) return;

  hideAlert();
  resetResults();

  resultsCard.style.display = "block";
  resultsSpinner.classList.add("show");
  resultsTableWrapper.style.display = "none";
  resultsEmptyState.style.display = "none";
  pagination.style.display = "none";

  resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const result = await executeQuery({
      queryId: selectedQueryId,
      configId: selectedConfigId,
      page: currentPage,
      pageSize: currentPageSize
    });

    if (result.error) {
      showAlert(result.error, "alert-error");
      resultsCard.style.display = "none";
      return;
    }

    totalPages = result.totalPages;

    resultSummary.innerHTML = `
      <span>Total Rows: ${result.totalRows}</span>
      <span>Page: ${result.page + 1} of ${result.totalPages}</span>
      <span>Columns: ${result.columns.length}</span>
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

async function runScratchQuery() {
  const queryText = scratchQuery.value.trim();

  hideScratchAlert();

  if (!queryText) {
    showScratchAlert("Please enter a SQL query.", "alert-error");
    return;
  }

  if (!scratchConfigId) {
    showScratchAlert("Please select a connection.", "alert-error");
    return;
  }

  resetScratchResults();
  scratchResultsArea.style.display = "block";
  scratchSpinner.classList.add("show");

  try {
    const result = await executeTempQuery({
      configId: scratchConfigId,
      queryText: queryText,
      page: scratchPage,
      pageSize: parseInt(scratchPageSizeEl.value, 10)
    });

    if (result.error) {
      showScratchAlert(result.error, "alert-error");
      scratchResultsArea.style.display = "none";
      return;
    }

    scratchTotalPages = result.totalPages;

    scratchSummary.innerHTML = `
      <span>Total Rows: ${result.totalRows}</span>
      <span>Page: ${result.page + 1} of ${result.totalPages}</span>
    `;

    if (!result.rows || result.rows.length === 0) {
      scratchEmptyState.style.display = "block";
    } else {
      renderTable(scratchTableHead, scratchTableBody, result.columns, result.rows);
      scratchTableWrapper.style.display = "block";
    }

    if (result.totalPages > 1) {
      scratchPageInfo.textContent = `Page ${result.page + 1} of ${result.totalPages}`;
      scratchPrevBtn.disabled = result.page === 0;
      scratchNextBtn.disabled = result.page >= result.totalPages - 1;
      scratchPagination.style.display = "flex";
    }
  } catch (err) {
    showScratchAlert("Query failed. Check your SQL and try again.", "alert-error");
    scratchResultsArea.style.display = "none";
  } finally {
    scratchSpinner.classList.remove("show");
  }
}

export function initQueryExecutionPage() {
  dbTypeSelect = document.getElementById("dbTypeSelect");
  connectionSelect = document.getElementById("connectionSelect");
  querySearchInput = document.getElementById("querySearchInput");
  querySearchResults = document.getElementById("querySearchResults");
  selectedQueryBadge = document.getElementById("selectedQueryBadge");
  selectedQueryName = document.getElementById("selectedQueryName");
  clearQueryBtn = document.getElementById("clearQueryBtn");
  queryPreviewBox = document.getElementById("queryPreviewBox");
  queryPreview = document.getElementById("queryPreview");
  queryDescriptionText = document.getElementById("queryDescriptionText");
  pageSizeSelect = document.getElementById("pageSizeSelect");
  executeBtn = document.getElementById("executeBtn");
  resetBtn = document.getElementById("resetBtn");
  executionAlert = document.getElementById("executionAlert");
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

  savedSearchInput = document.getElementById("savedSearchInput");
  savedTableAlert = document.getElementById("savedTableAlert");
  savedTableSpinner = document.getElementById("savedTableSpinner");
  savedTableWrapper = document.getElementById("savedTableWrapper");
  savedQueryTableBody = document.getElementById("savedQueryTableBody");
  savedEmptyState = document.getElementById("savedEmptyState");
  savedSearchCount = document.getElementById("savedSearchCount");

  step1Indicator = document.getElementById("step1Indicator");
  step2Indicator = document.getElementById("step2Indicator");
  step3Indicator = document.getElementById("step3Indicator");
  line1 = document.getElementById("line1");
  line2 = document.getElementById("line2");

  scratchpadToggle = document.getElementById("scratchpadToggle");
  scratchpadBody = document.getElementById("scratchpadBody");
  scratchDbType = document.getElementById("scratchDbType");
  scratchConnection = document.getElementById("scratchConnection");
  scratchQuery = document.getElementById("scratchQuery");
  scratchRunBtn = document.getElementById("scratchRunBtn");
  scratchClearBtn = document.getElementById("scratchClearBtn");
  scratchPageSizeEl = document.getElementById("scratchPageSize");
  scratchResultsArea = document.getElementById("scratchResultsArea");
  scratchSummary = document.getElementById("scratchSummary");
  scratchSpinner = document.getElementById("scratchSpinner");
  scratchTableWrapper = document.getElementById("scratchTableWrapper");
  scratchTableHead = document.getElementById("scratchTableHead");
  scratchTableBody = document.getElementById("scratchTableBody");
  scratchEmptyState = document.getElementById("scratchEmptyState");
  scratchPagination = document.getElementById("scratchPagination");
  scratchPrevBtn = document.getElementById("scratchPrevBtn");
  scratchNextBtn = document.getElementById("scratchNextBtn");
  scratchPageInfo = document.getElementById("scratchPageInfo");
  scratchpadAlert = document.getElementById("scratchpadAlert");

  if (!dbTypeSelect) return;

  updateSteps(0);

  savedSearchInput.addEventListener("input", () => {
    renderSavedTable(getSavedFilteredRows());
  });

  dbTypeSelect.addEventListener("change", async () => {
    hideAlert();
    resetQuerySelection();
    resetResults();

    const type = dbTypeSelect.value;

    connectionSelect.innerHTML = '<option value="">-- Loading connections... --</option>';
    connectionSelect.disabled = true;
    selectedConfigId = null;
    selectedDbType = null;

    updateSteps(type ? 1 : 0);

    if (!type) {
      connectionSelect.innerHTML = '<option value="">-- Select a DB Type first --</option>';
      return;
    }

    try {
      const configs = await getConfigsByDbType(type);

      connectionSelect.innerHTML = '<option value="">-- Select Connection --</option>';

      if (!Array.isArray(configs) || configs.length === 0) {
        showAlert(
          `No connections found for "${type}". Add one on the DB Config page.`,
          "alert-info"
        );
        connectionSelect.innerHTML = `<option value="" disabled>No connections for ${type}</option>`;
        return;
      }

      configs.forEach((config) => {
        const opt = document.createElement("option");
        opt.value = config.configId;
        opt.textContent = config.dbName;
        connectionSelect.appendChild(opt);
      });

      connectionSelect.disabled = false;
      selectedDbType = type;
    } catch (err) {
      showAlert("Failed to load connections. Please try again.", "alert-error");
    }
  });

  connectionSelect.addEventListener("change", async () => {
    hideAlert();
    resetQuerySelection();
    resetResults();

    selectedConfigId = connectionSelect.value
      ? parseInt(connectionSelect.value, 10)
      : null;

    updateSteps(selectedConfigId ? 2 : 1);

    if (!selectedConfigId) {
      querySearchInput.disabled = true;
      querySearchInput.placeholder = "Select a connection first...";
      return;
    }

    querySearchInput.disabled = true;
    querySearchInput.placeholder = "Loading queries...";

    try {
      allQueriesForType = await getAllQueries();
      allQueriesForType = allQueriesForType.filter(
        (q) => q.dbType === selectedDbType
      );

      if (allQueriesForType.length === 0) {
        querySearchInput.placeholder = `No queries saved for ${selectedDbType}`;
        querySearchInput.disabled = true;
        showAlert(
          `No queries found for "${selectedDbType}". Go to Query Management to add one.`,
          "alert-info"
        );
        return;
      }

      querySearchInput.disabled = false;
      querySearchInput.placeholder = `Search ${allQueriesForType.length} saved queries...`;
    } catch (err) {
      showAlert("Failed to load queries. Please try again.", "alert-error");
    }
  });

  querySearchInput.addEventListener("input", () => {
    const term = querySearchInput.value.trim().toLowerCase();
    renderSearchResults(term);
  });

  querySearchInput.addEventListener("focus", () => {
    if (allQueriesForType.length > 0) {
      renderSearchResults(querySearchInput.value.trim().toLowerCase());
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#querySearchWrapper")) {
      querySearchResults.classList.remove("open");
    }
  });

  clearQueryBtn.addEventListener("click", () => {
    resetQuerySelection();
    updateSteps(2);
  });

  pageSizeSelect.addEventListener("change", () => {
    currentPageSize = parseInt(pageSizeSelect.value, 10);
    if (selectedQueryId && selectedConfigId) {
      currentPage = 0;
      runExecution();
    }
  });

  executeBtn.addEventListener("click", () => {
    currentPage = 0;
    currentPageSize = parseInt(pageSizeSelect.value, 10);
    runExecution();
  });

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

  resetBtn.addEventListener("click", () => {
    dbTypeSelect.value = "";
    connectionSelect.innerHTML = '<option value="">-- Select a DB Type first --</option>';
    connectionSelect.disabled = true;
    querySearchInput.disabled = true;
    querySearchInput.placeholder = "Select a connection first...";
    allQueriesForType = [];
    selectedDbType = null;
    selectedConfigId = null;
    currentPage = 0;
    resetQuerySelection();
    hideAlert();
    updateSteps(0);
  });

  scratchpadToggle.addEventListener("click", () => {
    scratchpadToggle.classList.toggle("open");
    scratchpadBody.classList.toggle("open");
  });

  scratchDbType.addEventListener("change", async () => {
    hideScratchAlert();
    scratchConnection.innerHTML = '<option value="">-- Loading... --</option>';
    scratchConnection.disabled = true;
    scratchRunBtn.disabled = true;
    scratchConfigId = null;
    resetScratchResults();

    const type = scratchDbType.value;
    if (!type) {
      scratchConnection.innerHTML = '<option value="">-- Select DB Type first --</option>';
      return;
    }

    try {
      const configs = await getConfigsByDbType(type);
      scratchConnection.innerHTML = '<option value="">-- Select Connection --</option>';

      if (!Array.isArray(configs) || configs.length === 0) {
        scratchConnection.innerHTML = `<option value="" disabled>No connections for ${type}</option>`;
        return;
      }

      configs.forEach((config) => {
        const opt = document.createElement("option");
        opt.value = config.configId;
        opt.textContent = config.dbName;
        scratchConnection.appendChild(opt);
      });

      scratchConnection.disabled = false;
    } catch (err) {
      showScratchAlert("Failed to load connections.", "alert-error");
    }
  });

  scratchConnection.addEventListener("change", () => {
    scratchConfigId = scratchConnection.value
      ? parseInt(scratchConnection.value, 10)
      : null;
    scratchRunBtn.disabled = !scratchConfigId;
    resetScratchResults();
  });

  scratchRunBtn.addEventListener("click", () => {
    scratchPage = 0;
    scratchPageSize = parseInt(scratchPageSizeEl.value || 50, 10);
    runScratchQuery();
  });

  scratchPrevBtn.addEventListener("click", () => {
    if (scratchPage > 0) {
      scratchPage--;
      runScratchQuery();
    }
  });

  scratchNextBtn.addEventListener("click", () => {
    if (scratchPage < scratchTotalPages - 1) {
      scratchPage++;
      runScratchQuery();
    }
  });

  scratchClearBtn.addEventListener("click", () => {
    scratchDbType.value = "";
    scratchConnection.innerHTML = '<option value="">-- Select DB Type first --</option>';
    scratchConnection.disabled = true;
    scratchQuery.value = "";
    scratchRunBtn.disabled = true;
    scratchConfigId = null;
    hideScratchAlert();
    resetScratchResults();
  });

  loadDbTypes();
  loadSavedQueries();
}
