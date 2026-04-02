// ── State ──
let currentPage = 0;
let currentPageSize = 50;
let totalPages = 0;
let selectedQueryId = null;
let selectedDbType = null;

// ── Element References ──
const dbTypeSelect = document.getElementById("dbTypeSelect");
const querySelect = document.getElementById("querySelect");
const queryPreviewBox = document.getElementById("queryPreviewBox");
const queryPreview = document.getElementById("queryPreview");
const queryDescription = document.getElementById("queryDescription");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const executeBtn = document.getElementById("executeBtn");
const resetBtn = document.getElementById("resetBtn");
const executionAlert = document.getElementById("executionAlert");
const resultsCard = document.getElementById("resultsCard");
const resultsSpinner = document.getElementById("resultsSpinner");
const resultsTableWrapper = document.getElementById("resultsTableWrapper");
const resultsTableHead = document.getElementById("resultsTableHead");
const resultsTableBody = document.getElementById("resultsTableBody");
const resultsEmptyState = document.getElementById("resultsEmptyState");
const resultSummary = document.getElementById("resultSummary");
const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

// ─────────────────────────────────────────
// Utility — Show / Hide Alert
// ─────────────────────────────────────────
function showAlert(message, type) {
  executionAlert.textContent = message;
  executionAlert.className = `alert ${type} show`;
}

function hideAlert() {
  executionAlert.className = "alert";
  executionAlert.textContent = "";
}

// ─────────────────────────────────────────
// Load DB Types into Step 1 Dropdown
// ─────────────────────────────────────────
async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();

    dbTypeSelect.innerHTML = '<option value="">-- Select DB Type --</option>';

    if (!Array.isArray(types) || types.length === 0) {
      showAlert(
        "No database configurations found. Please add one on the DB Config page.",
        "alert-info",
      );
      return;
    }

    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      dbTypeSelect.appendChild(option);
    });
  } catch (err) {
    showAlert(
      "Failed to load DB types. Is the backend running?",
      "alert-error",
    );
  }
}

// ─────────────────────────────────────────
// Step 1 — DB Type Selected
// Load matching queries into Step 2 dropdown
// ─────────────────────────────────────────
dbTypeSelect.addEventListener("change", async () => {
  const selectedType = dbTypeSelect.value;
  hideAlert();
  resetResults();
  hideQueryPreview();

  // Reset Step 2
  querySelect.innerHTML = '<option value="">-- Loading queries... --</option>';
  querySelect.disabled = true;
  executeBtn.disabled = true;
  selectedQueryId = null;
  selectedDbType = null;

  if (!selectedType) {
    querySelect.innerHTML =
      '<option value="">-- Select a DB Type first --</option>';
    return;
  }

  try {
    const queries = await getQueriesByDbType(selectedType);

    querySelect.innerHTML = '<option value="">-- Select Query --</option>';

    if (!Array.isArray(queries) || queries.length === 0) {
      querySelect.innerHTML = `<option value="" disabled>
                No queries found for ${selectedType}
            </option>`;
      showAlert(
        `No queries saved for "${selectedType}". Go to Query Management to add one.`,
        "alert-info",
      );
      return;
    }

    queries.forEach((query) => {
      const option = document.createElement("option");
      option.value = query.queryId;
      option.textContent = query.name;
      // Store full query data as dataset for preview
      option.dataset.queryText = query.queryText;
      option.dataset.description = query.description || "";
      querySelect.appendChild(option);
    });

    querySelect.disabled = false;
    selectedDbType = selectedType;
  } catch (err) {
    showAlert("Failed to load queries. Please try again.", "alert-error");
    querySelect.innerHTML =
      '<option value="">-- Error loading queries --</option>';
  }
});

// ─────────────────────────────────────────
// Step 2 — Query Selected
// Show preview and enable Execute button
// ─────────────────────────────────────────
querySelect.addEventListener("change", () => {
  hideAlert();
  resetResults();

  const selectedOption = querySelect.options[querySelect.selectedIndex];

  if (!querySelect.value) {
    hideQueryPreview();
    executeBtn.disabled = true;
    selectedQueryId = null;
    return;
  }

  // Show query preview
  selectedQueryId = parseInt(querySelect.value);
  queryPreview.textContent = selectedOption.dataset.queryText;

  const desc = selectedOption.dataset.description;
  if (desc) {
    queryDescription.textContent = "📝 " + desc;
    queryDescription.style.display = "block";
  } else {
    queryDescription.style.display = "none";
  }

  queryPreviewBox.style.display = "block";
  executeBtn.disabled = false;
});

// ─────────────────────────────────────────
// Hide Query Preview
// ─────────────────────────────────────────
function hideQueryPreview() {
  queryPreviewBox.style.display = "none";
  queryPreview.textContent = "";
  queryDescription.textContent = "";
}

// ─────────────────────────────────────────
// Page Size Change — re-execute from page 0
// ─────────────────────────────────────────
pageSizeSelect.addEventListener("change", () => {
  currentPageSize = parseInt(pageSizeSelect.value);
  if (selectedQueryId) {
    currentPage = 0;
    runExecution();
  }
});

// ─────────────────────────────────────────
// Execute Button
// ─────────────────────────────────────────
executeBtn.addEventListener("click", () => {
  currentPage = 0;
  currentPageSize = parseInt(pageSizeSelect.value);
  runExecution();
});

// ─────────────────────────────────────────
// Core Execution Function
// ─────────────────────────────────────────
async function runExecution() {
  if (!selectedQueryId || !selectedDbType) return;

  hideAlert();
  resetResults();

  // Show results card and spinner
  resultsCard.style.display = "block";
  resultsSpinner.classList.add("show");
  resultsTableWrapper.style.display = "none";
  resultsEmptyState.style.display = "none";
  pagination.style.display = "none";

  // Scroll to results card smoothly
  resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const result = await executeQuery({
      queryId: selectedQueryId,
      dbType: selectedDbType,
      page: currentPage,
      pageSize: currentPageSize,
    });

    // Backend returned an error
    if (result.error) {
      showAlert(result.error, "alert-error");
      resultsCard.style.display = "none";
      return;
    }

    totalPages = result.totalPages;

    // Show result summary
    resultSummary.innerHTML = `
            <span>📊 <strong>Total Rows:</strong> ${result.totalRows}</span>
            <span>📄 <strong>Page:</strong> ${result.page + 1} of ${result.totalPages}</span>
            <span>📋 <strong>Columns:</strong> ${result.columns.length}</span>
        `;

    // Empty result set
    if (!result.rows || result.rows.length === 0) {
      resultsEmptyState.style.display = "block";
    } else {
      renderResultsTable(result.columns, result.rows);
      resultsTableWrapper.style.display = "block";
    }

    // Show pagination if more than one page
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

// ─────────────────────────────────────────
// Render Results Table
// ─────────────────────────────────────────
function renderResultsTable(columns, rows) {
  // Build header
  resultsTableHead.innerHTML = "";
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  resultsTableHead.appendChild(headerRow);

  // Build body
  resultsTableBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      if (cell === "NULL") {
        td.innerHTML =
          '<span style="color:#999; font-style:italic;">NULL</span>';
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    resultsTableBody.appendChild(tr);
  });
}

// ─────────────────────────────────────────
// Pagination Controls
// ─────────────────────────────────────────
function updatePagination(page, total) {
  pageInfo.textContent = `Page ${page + 1} of ${total}`;
  prevBtn.disabled = page === 0;
  nextBtn.disabled = page >= total - 1;
}

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

// ─────────────────────────────────────────
// Reset Results Area
// ─────────────────────────────────────────
function resetResults() {
  resultsCard.style.display = "none";
  resultsTableHead.innerHTML = "";
  resultsTableBody.innerHTML = "";
  resultsEmptyState.style.display = "none";
  resultsTableWrapper.style.display = "none";
  pagination.style.display = "none";
  resultSummary.innerHTML = "";
}

// ─────────────────────────────────────────
// Reset Button — Full page reset
// ─────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  dbTypeSelect.value = "";
  querySelect.innerHTML =
    '<option value="">-- Select a DB Type first --</option>';
  querySelect.disabled = true;
  executeBtn.disabled = true;
  selectedQueryId = null;
  selectedDbType = null;
  currentPage = 0;
  hideQueryPreview();
  resetResults();
  hideAlert();
});

// ─────────────────────────────────────────
// Init — Load DB Types on page load
// ─────────────────────────────────────────
loadDbTypes();
