import {
  executeTempQuery,
  getAllDbTypes,
  getConfigsByDbType
} from "./api.js";

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
let scratchResultsAlert;
let appShell;
let scratchpadPanel;
let scratchpadFab;
let scratchpadCloseBtn;
let scratchResultsOverlay;
let scratchResultsCloseBtn;

let scratchPage = 0;
let scratchTotalPages = 0;
let scratchConfigId = null;

function showScratchAlert(message, type) {
  if (!scratchpadAlert) return;
  scratchpadAlert.textContent = message;
  scratchpadAlert.className = `alert ${type} show`;
}

function hideScratchAlert() {
  if (!scratchpadAlert) return;
  scratchpadAlert.className = "alert";
  scratchpadAlert.textContent = "";
}

function showResultsAlert(message, type) {
  if (!scratchResultsAlert) return;
  scratchResultsAlert.textContent = message;
  scratchResultsAlert.className = `alert ${type} show`;
}

function hideResultsAlert() {
  if (!scratchResultsAlert) return;
  scratchResultsAlert.className = "alert";
  scratchResultsAlert.textContent = "";
}

function resetScratchResults() {
  if (!scratchResultsArea) return;
  scratchResultsArea.style.display = "none";
  scratchTableHead.innerHTML = "";
  scratchTableBody.innerHTML = "";
  scratchEmptyState.style.display = "none";
  scratchTableWrapper.style.display = "none";
  scratchPagination.style.display = "none";
  scratchSummary.innerHTML = "";
  hideResultsAlert();
}

function openResultsOverlay() {
  if (!scratchResultsOverlay) return;
  scratchResultsOverlay.classList.add("is-open");
}

function closeResultsOverlay() {
  if (!scratchResultsOverlay) return;
  scratchResultsOverlay.classList.remove("is-open");
}

function renderTable(columns, rows) {
  scratchTableHead.innerHTML = "";
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  scratchTableHead.appendChild(headerRow);

  scratchTableBody.innerHTML = "";
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
    scratchTableBody.appendChild(tr);
  });
}

async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();
    if (scratchDbType) {
      scratchDbType.innerHTML = '<option value="">-- Select DB Type --</option>';
    }
    if (!Array.isArray(types) || types.length === 0) return;

    types.forEach((type) => {
      if (!scratchDbType) return;
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type;
      scratchDbType.appendChild(opt);
    });
  } catch (err) {
    showScratchAlert("Failed to load DB types.", "alert-error");
  }
}

async function runScratchQuery() {
  const queryText = scratchQuery.value.trim();

  hideScratchAlert();
  hideResultsAlert();

  if (!queryText) {
    showScratchAlert("Please enter a SQL query.", "alert-error");
    return;
  }

  if (!scratchConfigId) {
    showScratchAlert("Please select a connection.", "alert-error");
    return;
  }

  resetScratchResults();
  openResultsOverlay();
  scratchResultsArea.style.display = "block";
  scratchSpinner.classList.add("show");

  try {
    const result = await executeTempQuery({
      configId: scratchConfigId,
      queryText: queryText,
      page: scratchPage,
      pageSize: parseInt(scratchPageSizeEl.value, 10)
    });

    const errorMessage = result.error || result.message;
    if (errorMessage) {
      showResultsAlert(errorMessage, "alert-error");
      scratchResultsArea.style.display = "block";
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
      renderTable(result.columns, result.rows);
      scratchTableWrapper.style.display = "block";
    }

    if (result.totalPages > 1) {
      scratchPageInfo.textContent = `Page ${result.page + 1} of ${result.totalPages}`;
      scratchPrevBtn.disabled = result.page === 0;
      scratchNextBtn.disabled = result.page >= result.totalPages - 1;
      scratchPagination.style.display = "flex";
    }
  } catch (err) {
    showResultsAlert("Query failed. Check your SQL and try again.", "alert-error");
    scratchResultsArea.style.display = "block";
  } finally {
    scratchSpinner.classList.remove("show");
  }
}

export function initScratchpad() {
  if (window.__scratchpadInitialized) return;
  window.__scratchpadInitialized = true;

  appShell = document.getElementById("appShell");
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
  scratchResultsAlert = document.getElementById("scratchResultsAlert");
  scratchpadPanel = document.getElementById("scratchpadPanel");
  scratchpadFab = document.getElementById("scratchpadFab");
  scratchpadCloseBtn = document.getElementById("scratchpadCloseBtn");
  scratchResultsOverlay = document.getElementById("scratchResultsOverlay");
  scratchResultsCloseBtn = document.getElementById("scratchResultsCloseBtn");

  if (!appShell || !scratchpadPanel || !scratchpadFab) return;

  const closeScratchpad = () => {
    appShell.classList.remove("panel-open");
    scratchpadPanel.setAttribute("aria-hidden", "true");
    closeResultsOverlay();
  };

  scratchpadFab.addEventListener("click", () => {
    appShell.classList.add("panel-open");
    scratchpadPanel.setAttribute("aria-hidden", "false");
  });

  if (scratchpadCloseBtn) {
    scratchpadCloseBtn.addEventListener("click", closeScratchpad);
  }

  if (scratchResultsCloseBtn) {
    scratchResultsCloseBtn.addEventListener("click", closeResultsOverlay);
  }

  if (scratchResultsOverlay) {
    scratchResultsOverlay.addEventListener("click", (e) => {
      if (e.target === scratchResultsOverlay) {
        closeResultsOverlay();
      }
    });
  }

  if (scratchDbType) {
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
  }

  if (scratchConnection) {
    scratchConnection.addEventListener("change", () => {
      scratchConfigId = scratchConnection.value
        ? parseInt(scratchConnection.value, 10)
        : null;
      scratchRunBtn.disabled = !scratchConfigId;
      resetScratchResults();
    });
  }

  if (scratchRunBtn) {
    scratchRunBtn.addEventListener("click", () => {
      scratchPage = 0;
      runScratchQuery();
    });
  }

  if (scratchPrevBtn) {
    scratchPrevBtn.addEventListener("click", () => {
      if (scratchPage > 0) {
        scratchPage--;
        runScratchQuery();
      }
    });
  }

  if (scratchNextBtn) {
    scratchNextBtn.addEventListener("click", () => {
      if (scratchPage < scratchTotalPages - 1) {
        scratchPage++;
        runScratchQuery();
      }
    });
  }

  if (scratchClearBtn) {
    scratchClearBtn.addEventListener("click", () => {
      scratchDbType.value = "";
      scratchConnection.innerHTML = '<option value="">-- Select DB Type first --</option>';
      scratchConnection.disabled = true;
      scratchQuery.value = "";
      scratchRunBtn.disabled = true;
      scratchConfigId = null;
      hideScratchAlert();
      resetScratchResults();
      closeResultsOverlay();
    });
  }

  loadDbTypes();
}
