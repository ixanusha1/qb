import {
  deleteQuery,
  executeTempQuery,
  getAllDbTypes,
  getAllQueries,
  getConfigsByDbType,
  getSchemaColumns,
  getSchemaTables,
  saveQuery
} from "./api.js";

let allQueries = [];
let builderConfigId = null;
let builderSelectedDbType = null;
let builderTable = null;
let builderColumns = [];
let allTables = [];
let joinCount = 0;
let whereCount = 0;
let testRunPage = 0;
let testRunTotalPages = 0;

let queryNameInput;
let dbTypeSelect;
let descriptionInput;
let queryTextArea;
let saveQueryBtn;
let clearBtn;
let formAlert;

let testConnectionGroupEl;
let testConnectionEl;
let testRunBtnEl;
let testRunAreaEl;
let testRunAlertEl;
let testRunSpinnerEl;
let testRunSummaryEl;
let testRunTableWrapperEl;
let testRunTableHeadEl;
let testRunTableBodyEl;
let testRunEmptyStateEl;
let testRunPaginationEl;
let testRunPrevBtnEl;
let testRunNextBtnEl;
let testRunPageInfoEl;
let testRunSuccessful = false;

let tableAlert;
let tableSpinner;
let queryTableBody;
let emptyState;
let tableWrapper;
let filterDbType;
let searchInput;
let searchCount;

let builderToggle;
let builderBody;
let builderAlert;
let builderDbTypeEl;
let builderConn;
let builderTableSel;
let columnCheckboxes;
let joinRowsEl;
let whereRowsEl;
let addJoinBtn;
let addWhereBtn;
let generatedSql;
let useQueryBtn;
let resetBuilderBtn;

let builderStep2;
let builderStep3;
let builderStep4;
let builderStep5;
let builderStep6;

function showAlert(el, message, type) {
  el.textContent = message;
  el.className = `alert ${type} show`;
}

function hideAlert(el) {
  el.className = "alert";
  el.textContent = "";
}

function enableBuilderStep(step) {
  step.style.opacity = "1";
  step.style.pointerEvents = "auto";
}

function disableBuilderStep(step) {
  step.style.opacity = "0.4";
  step.style.pointerEvents = "none";
}

function saveFormState() {
  sessionStorage.setItem("qm_name", queryNameInput.value);
  sessionStorage.setItem("qm_dbType", dbTypeSelect.value);
  sessionStorage.setItem("qm_description", descriptionInput.value);
  sessionStorage.setItem("qm_queryText", queryTextArea.value);
}

function restoreFormState() {
  const name = sessionStorage.getItem("qm_name");
  const dbType = sessionStorage.getItem("qm_dbType");
  const desc = sessionStorage.getItem("qm_description");
  const query = sessionStorage.getItem("qm_queryText");

  if (name) queryNameInput.value = name;
  if (desc) descriptionInput.value = desc;
  if (query) queryTextArea.value = query;

  if (dbType) sessionStorage.setItem("qm_pending_dbType", dbType);
}

function clearFormState() {
  sessionStorage.removeItem("qm_name");
  sessionStorage.removeItem("qm_dbType");
  sessionStorage.removeItem("qm_description");
  sessionStorage.removeItem("qm_queryText");
  sessionStorage.removeItem("qm_pending_dbType");
}

function saveBuilderState() {
  sessionStorage.setItem("qm_builder_dbType", builderDbTypeEl.value);
  sessionStorage.setItem("qm_builder_configId", builderConn.value);
  sessionStorage.setItem("qm_builder_table", builderTableSel.value);
}

function clearBuilderState() {
  sessionStorage.removeItem("qm_builder_dbType");
  sessionStorage.removeItem("qm_builder_configId");
  sessionStorage.removeItem("qm_builder_table");
}

async function restoreBuilderState() {
  const dbType = sessionStorage.getItem("qm_builder_dbType");
  const configId = sessionStorage.getItem("qm_builder_configId");
  const table = sessionStorage.getItem("qm_builder_table");

  if (!dbType) return;

  builderDbTypeEl.value = dbType;
  builderSelectedDbType = dbType;

  try {
    const configs = await getConfigsByDbType(dbType);
    builderConn.innerHTML = '<option value="">-- Select Connection --</option>';

    if (!Array.isArray(configs) || configs.length === 0) return;

    configs.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.configId;
      opt.textContent = c.dbName;
      builderConn.appendChild(opt);
    });

    builderConn.disabled = false;

    if (!configId) return;

    builderConn.value = configId;
    builderConfigId = parseInt(configId, 10);

    const tables = await getSchemaTables(builderConfigId);
    allTables = tables;

    builderTableSel.innerHTML = '<option value="">-- Select Table --</option>';
    tables.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      builderTableSel.appendChild(opt);
    });

    enableBuilderStep(builderStep2);

    if (!table) return;

    builderTableSel.value = table;
    builderTable = table;

    const columns = await getSchemaColumns(builderConfigId, table);
    builderColumns = columns;

    columnCheckboxes.innerHTML = "";
    columns.forEach((col) => {
      const item = document.createElement("label");
      item.className = "column-checkbox-item";
      item.innerHTML = `
        <input type="checkbox" class="col-checkbox" value="${col}" />
        ${col}
      `;
      item.querySelector("input").addEventListener("change", generateSQL);
      columnCheckboxes.appendChild(item);
    });

    enableBuilderStep(builderStep3);
    enableBuilderStep(builderStep4);
    enableBuilderStep(builderStep5);
    enableBuilderStep(builderStep6);

    generateSQL();
  } catch (err) {
    console.error("Failed to restore builder state:", err);
  }
}

async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();

    dbTypeSelect.innerHTML = '<option value="">-- Select Type --</option>';
    filterDbType.innerHTML = '<option value="">-- All Types --</option>';
    builderDbTypeEl.innerHTML = '<option value="">-- Select DB Type --</option>';

    if (!Array.isArray(types) || types.length === 0) return;

    types.forEach((type) => {
      [dbTypeSelect, filterDbType, builderDbTypeEl].forEach((sel) => {
        const opt = document.createElement("option");
        opt.value = type;
        opt.textContent = type;
        sel.appendChild(opt);
      });
    });

    const pendingDbType = sessionStorage.getItem("qm_pending_dbType");
    if (pendingDbType) {
      dbTypeSelect.value = pendingDbType;
      sessionStorage.removeItem("qm_pending_dbType");
      await loadTestConnections(pendingDbType);
    }
  } catch (err) {
    showAlert(
      formAlert,
      "Failed to load DB types. Is the backend running?",
      "alert-error"
    );
  }
}

async function loadTestConnections(dbType) {
  try {
    const configs = await getConfigsByDbType(dbType);

    if (!Array.isArray(configs) || configs.length === 0) return;

    testConnectionEl.innerHTML =
      '<option value="">-- Select Connection --</option>';
    configs.forEach((config) => {
      const opt = document.createElement("option");
      opt.value = config.configId;
      opt.textContent = config.dbName;
      testConnectionEl.appendChild(opt);
    });

    testConnectionGroupEl.style.display = "block";

    if (configs.length === 1) {
      testConnectionEl.value = configs[0].configId;
      updateTestRunBtn();
    }
  } catch (err) {
    console.error("Failed to load test connections:", err);
  }
}

function updateTestRunBtn() {
  testRunBtnEl.disabled = !(
    testConnectionEl.value &&
    queryTextArea.value.trim() &&
    queryNameInput.value.trim() &&
    descriptionInput.value.trim() &&
    dbTypeSelect.value
  );
}

function resetTestRunResults() {
  testRunAlertEl.className = "alert";
  testRunAlertEl.textContent = "";
  testRunSummaryEl.style.display = "none";
  testRunTableWrapperEl.style.display = "none";
  testRunEmptyStateEl.style.display = "none";
  testRunPaginationEl.style.display = "none";
  testRunTableHeadEl.innerHTML = "";
  testRunTableBodyEl.innerHTML = "";
  testRunSuccessful = false;
  if (saveQueryBtn) saveQueryBtn.classList.add("is-hidden");
  if (testRunBtnEl) testRunBtnEl.classList.remove("is-hidden");
  if (clearBtn) clearBtn.classList.remove("is-hidden");
}

function resetTestRun() {
  testRunPage = 0;
  testRunTotalPages = 0;
  resetTestRunResults();
  testRunAreaEl.style.display = "none";
}

function renderTestTable(columns, rows) {
  testRunTableHeadEl.innerHTML = "";
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  testRunTableHeadEl.appendChild(headerRow);

  testRunTableBodyEl.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell === "NULL" ? "NULL" : cell;
      tr.appendChild(td);
    });
    testRunTableBodyEl.appendChild(tr);
  });
}

function renderTable(queries) {
  const term = searchInput.value.trim().toLowerCase();

  queryTableBody.innerHTML = "";

  searchCount.textContent =
    queries.length === allQueries.length
      ? `${allQueries.length} queries total`
      : `Showing ${queries.length} of ${allQueries.length} queries`;

  if (queries.length === 0) {
    tableWrapper.style.display = "none";
    emptyState.style.display = "block";
    emptyState.textContent = term
      ? `No queries match "${term}".`
      : "No queries saved yet. Add one above.";
    return;
  }

  emptyState.style.display = "none";
  tableWrapper.style.display = "block";

  queries.forEach((query, index) => {
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

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${highlightedName}</strong></td>
      <td>${description}</td>
      <td><span class="badge badge-info">${query.dbType}</span></td>
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
      <td></td>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.style.padding = "6px 14px";
    deleteBtn.style.fontSize = "12px";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () =>
      handleDelete(query.queryId, query.name)
    );

    row.querySelector("td:last-child").appendChild(deleteBtn);
    queryTableBody.appendChild(row);
  });
}

async function handleDelete(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  try {
    const response = await deleteQuery(id);

    if (response.ok || response.status === 204) {
      showAlert(tableAlert, `Query "${name}" deleted successfully.`, "alert-success");
      await loadQueries();
    } else {
      const result = await response.json();
      showAlert(tableAlert, result.error || "Failed to delete.", "alert-error");
    }
  } catch (err) {
    showAlert(tableAlert, "Something went wrong while deleting.", "alert-error");
  }
}

function getFilteredQueries() {
  const term = searchInput.value.trim().toLowerCase();
  const typeFilter = filterDbType.value;

  return allQueries.filter((q) => {
    const matchesType = typeFilter ? q.dbType === typeFilter : true;
    const matchesTerm = term
      ? q.name.toLowerCase().includes(term) ||
        (q.description && q.description.toLowerCase().includes(term))
      : true;
    return matchesType && matchesTerm;
  });
}

async function loadQueries() {
  tableSpinner.classList.add("show");
  tableWrapper.style.display = "none";
  emptyState.style.display = "none";
  hideAlert(tableAlert);

  try {
    allQueries = await getAllQueries();
    renderTable(getFilteredQueries());
  } catch (err) {
    showAlert(tableAlert, "Failed to load queries.", "alert-error");
  } finally {
    tableSpinner.classList.remove("show");
  }
}

function generateSQL() {
  if (!builderTable) return;

  const checked = [...document.querySelectorAll(".col-checkbox:checked")].map(
    (cb) => cb.value
  );
  const columnPart = checked.length > 0 ? checked.join(", ") : "*";

  const joinClauses = [];
  document.querySelectorAll(".join-row").forEach((row) => {
    const type = row.querySelector(".join-type")?.value;
    const table = row.querySelector(".join-table")?.value;
    const left = row.querySelector(".join-on-left")?.value;
    const right = row.querySelector(".join-on-right")?.value;
    if (type && table && left && right) {
      joinClauses.push(`${type} ${table} ON ${left} = ${right}`);
    }
  });

  const whereClauses = [];
  document.querySelectorAll(".where-row").forEach((row) => {
    const col = row.querySelector(".where-column")?.value;
    const operator = row.querySelector(".where-operator")?.value;
    const value = row.querySelector(".where-value")?.value.trim();

    if (col && operator) {
      if (operator === "IS NULL" || operator === "IS NOT NULL") {
        whereClauses.push(`${col} ${operator}`);
      } else if (value) {
        const isNumeric = !isNaN(value) && value !== "";
        const formatted = isNumeric ? value : `'${value}'`;
        whereClauses.push(`${col} ${operator} ${formatted}`);
      }
    }
  });

  let sql = `SELECT ${columnPart}\nFROM ${builderTable}`;
  if (joinClauses.length > 0) sql += "\n" + joinClauses.join("\n");
  if (whereClauses.length > 0)
    sql += "\nWHERE " + whereClauses.join("\n  AND ");

  generatedSql.innerHTML = syntaxHighlight(sql);
}

function syntaxHighlight(sql) {
  return sql
    .replace(
      /\b(SELECT|FROM|WHERE|AND|OR|INNER JOIN|LEFT JOIN|RIGHT JOIN|ON|IS NULL|IS NOT NULL|LIKE)\b/g,
      '<span class="sql-keyword">$1</span>'
    )
    .replace(/\*/g, '<span class="sql-column">*</span>');
}

function resetBuilderFromStep2() {
  builderTableSel.innerHTML =
    '<option value="">-- Select a connection first --</option>';
  columnCheckboxes.innerHTML =
    '<span style="color:#888;font-size:13px;">Select a table to see columns</span>';
  joinRowsEl.innerHTML = "";
  whereRowsEl.innerHTML = "";
  joinCount = 0;
  whereCount = 0;
  generatedSql.innerHTML = "Select a table to generate SQL...";
  builderTable = null;
  builderColumns = [];

  disableBuilderStep(builderStep2);
  disableBuilderStep(builderStep3);
  disableBuilderStep(builderStep4);
  disableBuilderStep(builderStep5);
  disableBuilderStep(builderStep6);
}

function removeRow(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
  generateSQL();
}

function addJoinRow() {
  joinCount++;
  const id = `join_${joinCount}`;
  const row = document.createElement("div");
  row.className = "join-row";
  row.id = id;

  const joinTableOptions = allTables
    .filter((t) => t !== builderTable)
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("");

  row.innerHTML = `
    <select class="join-type">
      <option value="INNER JOIN">INNER JOIN</option>
      <option value="LEFT JOIN">LEFT JOIN</option>
      <option value="RIGHT JOIN">RIGHT JOIN</option>
    </select>
    <select class="join-table">
      <option value="">-- Join Table --</option>
      ${joinTableOptions}
    </select>
    <select class="join-on-left">
      <option value="">-- Left Column --</option>
    </select>
    <select class="join-on-right">
      <option value="">-- Right Column --</option>
    </select>
    <button class="remove-btn">x</button>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => removeRow(id));
  row.querySelector(".join-type").addEventListener("change", generateSQL);
  row.querySelector(".join-on-left").addEventListener("change", generateSQL);
  row.querySelector(".join-on-right").addEventListener("change", generateSQL);

  row.querySelector(".join-table").addEventListener("change", async (e) => {
    const joinTable = e.target.value;
    const leftSel = row.querySelector(".join-on-left");
    const rightSel = row.querySelector(".join-on-right");

    leftSel.innerHTML = '<option value="">-- Left Column --</option>';
    rightSel.innerHTML = '<option value="">-- Right Column --</option>';

    if (!joinTable) return;

    builderColumns.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = `${builderTable}.${c}`;
      opt.textContent = `${builderTable}.${c}`;
      leftSel.appendChild(opt);
    });

    try {
      const columns = await getSchemaColumns(builderConfigId, joinTable);
      columns.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = `${joinTable}.${c}`;
        opt.textContent = `${joinTable}.${c}`;
        rightSel.appendChild(opt);
      });
    } catch (err) {
      rightSel.innerHTML = '<option value="">-- Failed to load --</option>';
    }

    generateSQL();
  });

  joinRowsEl.appendChild(row);
  generateSQL();
}

function addWhereRow() {
  whereCount++;
  const id = `where_${whereCount}`;
  const row = document.createElement("div");
  row.className = "where-row";
  row.id = id;

  const allColumnOptions = builderColumns
    .map((c) => `<option value="${builderTable}.${c}">${builderTable}.${c}</option>`)
    .join("");

  row.innerHTML = `
    <select class="where-column">
      <option value="">-- Column --</option>
      ${allColumnOptions}
    </select>
    <select class="where-operator">
      <option value="=">=</option>
      <option value="!=">!=</option>
      <option value=">">></option>
      <option value="<"><</option>
      <option value=">=">>=</option>
      <option value="<="><=</option>
      <option value="LIKE">LIKE</option>
      <option value="IS NULL">IS NULL</option>
      <option value="IS NOT NULL">IS NOT NULL</option>
    </select>
    <input type="text" class="where-value" placeholder="value" />
    <button class="remove-btn">x</button>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => removeRow(id));
  row.querySelector(".where-column").addEventListener("change", generateSQL);
  row.querySelector(".where-operator").addEventListener("change", generateSQL);
  row.querySelector(".where-value").addEventListener("input", generateSQL);

  whereRowsEl.appendChild(row);
  generateSQL();
}

export function initQueryManagementPage() {
  queryNameInput = document.getElementById("queryName");
  dbTypeSelect = document.getElementById("dbType");
  descriptionInput = document.getElementById("description");
  queryTextArea = document.getElementById("queryText");
  saveQueryBtn = document.getElementById("saveQueryBtn");
  clearBtn = document.getElementById("clearBtn");
  formAlert = document.getElementById("formAlert");

  testConnectionGroupEl = document.getElementById("testConnectionGroup");
  testConnectionEl = document.getElementById("testConnection");
  testRunBtnEl = document.getElementById("testRunBtn");
  testRunAreaEl = document.getElementById("testRunArea");
  testRunAlertEl = document.getElementById("testRunAlert");
  testRunSpinnerEl = document.getElementById("testRunSpinner");
  testRunSummaryEl = document.getElementById("testRunSummary");
  testRunTableWrapperEl = document.getElementById("testRunTableWrapper");
  testRunTableHeadEl = document.getElementById("testRunTableHead");
  testRunTableBodyEl = document.getElementById("testRunTableBody");
  testRunEmptyStateEl = document.getElementById("testRunEmptyState");
  testRunPaginationEl = document.getElementById("testRunPagination");
  testRunPrevBtnEl = document.getElementById("testRunPrevBtn");
  testRunNextBtnEl = document.getElementById("testRunNextBtn");
  testRunPageInfoEl = document.getElementById("testRunPageInfo");

  tableAlert = document.getElementById("tableAlert");
  tableSpinner = document.getElementById("tableSpinner");
  queryTableBody = document.getElementById("queryTableBody");
  emptyState = document.getElementById("emptyState");
  tableWrapper = document.getElementById("tableWrapper");
  filterDbType = document.getElementById("filterDbType");
  searchInput = document.getElementById("searchInput");
  searchCount = document.getElementById("searchCount");

  builderToggle = document.getElementById("builderToggle");
  builderBody = document.getElementById("builderBody");
  builderAlert = document.getElementById("builderAlert");
  builderDbTypeEl = document.getElementById("builderDbType");
  builderConn = document.getElementById("builderConnection");
  builderTableSel = document.getElementById("builderTable");
  columnCheckboxes = document.getElementById("columnCheckboxes");
  joinRowsEl = document.getElementById("joinRows");
  whereRowsEl = document.getElementById("whereRows");
  addJoinBtn = document.getElementById("addJoinBtn");
  addWhereBtn = document.getElementById("addWhereBtn");
  generatedSql = document.getElementById("generatedSql");
  useQueryBtn = document.getElementById("useQueryBtn");
  resetBuilderBtn = document.getElementById("resetBuilderBtn");

  builderStep2 = document.getElementById("builderStep2");
  builderStep3 = document.getElementById("builderStep3");
  builderStep4 = document.getElementById("builderStep4");
  builderStep5 = document.getElementById("builderStep5");
  builderStep6 = document.getElementById("builderStep6");

  if (!queryNameInput) return;

  [queryNameInput, descriptionInput, queryTextArea].forEach((el) => {
    el.addEventListener("input", () => {
      saveFormState();
      if (testRunSuccessful) {
        resetTestRunResults();
      }
      updateTestRunBtn();
    });
  });

  builderToggle.addEventListener("click", () => {
    builderToggle.classList.toggle("open");
    builderBody.classList.toggle("open");
  });

  dbTypeSelect.addEventListener("change", async () => {
    saveFormState();
    resetTestRun();
    testRunBtnEl.disabled = true;
    testConnectionGroupEl.style.display = "none";
    testConnectionEl.innerHTML =
      '<option value="">-- Select Connection --</option>';

    if (!dbTypeSelect.value) return;

    await loadTestConnections(dbTypeSelect.value);
    updateTestRunBtn();
  });

  testConnectionEl.addEventListener("change", () => {
    if (testRunSuccessful) {
      resetTestRunResults();
    }
    updateTestRunBtn();
  });
  queryTextArea.addEventListener("input", () => {
    saveFormState();
    updateTestRunBtn();
  });

  testRunBtnEl.addEventListener("click", () => {
    testRunPage = 0;
    runTestQuery();
  });

  testRunPrevBtnEl.addEventListener("click", () => {
    if (testRunPage > 0) {
      testRunPage--;
      runTestQuery();
    }
  });

  testRunNextBtnEl.addEventListener("click", () => {
    if (testRunPage < testRunTotalPages - 1) {
      testRunPage++;
      runTestQuery();
    }
  });

  async function runTestQuery() {
    const queryText = queryTextArea.value.trim();
    const configId = parseInt(testConnectionEl.value, 10);

    if (!queryText) {
      showAlert(testRunAlertEl, "Please enter a SQL query first.", "alert-error");
      return;
    }
    if (!configId) {
      showAlert(testRunAlertEl, "Please select a connection.", "alert-error");
      return;
    }

    resetTestRunResults();
    testRunAreaEl.style.display = "block";
    testRunSpinnerEl.classList.add("show");

    testRunAreaEl.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const result = await executeTempQuery({
        configId: configId,
        queryText: queryText,
        page: testRunPage,
        pageSize: 10
      });

        const errorMessage = result.error || result.message;
        if (errorMessage) {
            showAlert(testRunAlertEl, errorMessage, "alert-error");
            testRunSuccessful = false;
            if (saveQueryBtn) saveQueryBtn.classList.add("is-hidden");
            if (testRunBtnEl) testRunBtnEl.classList.remove("is-hidden");
            if (clearBtn) clearBtn.classList.remove("is-hidden");
            return;
        }

      testRunTotalPages = result.totalPages;

      testRunSummaryEl.innerHTML = `
        OK <strong>Test passed.</strong>
        &nbsp; Total Rows: ${result.totalRows}
        &nbsp; Page: ${result.page + 1} of ${result.totalPages}
        &nbsp; Columns: ${result.columns.length}
      `;
        testRunSummaryEl.style.display = "block";
        testRunSuccessful = true;
        if (saveQueryBtn) saveQueryBtn.classList.remove("is-hidden");
        if (testRunBtnEl) testRunBtnEl.classList.add("is-hidden");
        if (clearBtn) clearBtn.classList.add("is-hidden");

      if (!result.rows || result.rows.length === 0) {
        testRunEmptyStateEl.style.display = "block";
      } else {
        renderTestTable(result.columns, result.rows);
        testRunTableWrapperEl.style.display = "block";
      }

      if (result.totalPages > 1) {
        testRunPageInfoEl.textContent = `Page ${result.page + 1} of ${result.totalPages}`;
        testRunPrevBtnEl.disabled = result.page === 0;
        testRunNextBtnEl.disabled = result.page >= result.totalPages - 1;
        testRunPaginationEl.style.display = "flex";
      }
    } catch (err) {
      showAlert(
        testRunAlertEl,
        "Test run failed. Check your query and connection.",
        "alert-error"
      );
      testRunSuccessful = false;
      if (saveQueryBtn) saveQueryBtn.classList.add("is-hidden");
      if (testRunBtnEl) testRunBtnEl.classList.remove("is-hidden");
      if (clearBtn) clearBtn.classList.remove("is-hidden");
    } finally {
      testRunSpinnerEl.classList.remove("show");
    }
  }

  saveQueryBtn.addEventListener("click", async () => {
    hideAlert(formAlert);

    const data = {
      name: queryNameInput.value.trim(),
      dbType: dbTypeSelect.value.trim(),
      description: descriptionInput.value.trim(),
      queryText: queryTextArea.value.trim(),
      configId: testConnectionEl.value ? parseInt(testConnectionEl.value, 10) : null
    };

    if (!data.name) {
      showAlert(formAlert, "Query name is required.", "alert-error");
      queryNameInput.focus();
      return;
    }
    if (!data.description) {
      showAlert(formAlert, "Description is required.", "alert-error");
      descriptionInput.focus();
      return;
    }
    if (!data.dbType) {
      showAlert(formAlert, "Please select a database type.", "alert-error");
      return;
    }
    if (!data.configId) {
      showAlert(
        formAlert,
        "Please select a default execution connection.",
        "alert-error"
      );
      return;
    }
    if (!data.queryText) {
      showAlert(formAlert, "SQL query cannot be empty.", "alert-error");
      queryTextArea.focus();
      return;
    }

    saveQueryBtn.disabled = true;
    saveQueryBtn.textContent = "Saving...";

    try {
      const result = await saveQuery(data);

      if (result.queryId) {
        showAlert(
          formAlert,
          `Query "${result.name}" saved successfully.`,
          "alert-success"
        );
        resetForm();
        await loadQueries();
      } else {
        const message =
          result.error || result.message || "Failed to save query.";
        showAlert(formAlert, message, "alert-error");
      }
    } catch (err) {
      showAlert(formAlert, "Something went wrong. Please try again.", "alert-error");
    } finally {
      saveQueryBtn.disabled = false;
      saveQueryBtn.textContent = "Save Query";
    }
  });

  clearBtn.addEventListener("click", () => {
    resetForm();
    hideAlert(formAlert);
  });

  function resetForm() {
    queryNameInput.value = "";
    dbTypeSelect.value = "";
    descriptionInput.value = "";
    queryTextArea.value = "";
    testConnectionGroupEl.style.display = "none";
    testConnectionEl.innerHTML =
      '<option value="">-- Select Connection --</option>';
    testRunBtnEl.disabled = true;
    resetTestRun();
    clearFormState();
  }

  searchInput.addEventListener("input", () => {
    renderTable(getFilteredQueries());
  });

  filterDbType.addEventListener("change", () => {
    renderTable(getFilteredQueries());
  });

  builderDbTypeEl.addEventListener("change", async () => {
    builderSelectedDbType = builderDbTypeEl.value;
    builderConn.disabled = true;
    builderConn.innerHTML = '<option value="">-- Select DB Type first --</option>';
    resetBuilderFromStep2();
    clearBuilderState();

    if (!builderSelectedDbType) return;

    try {
      const configs = await getConfigsByDbType(builderSelectedDbType);
      builderConn.innerHTML = '<option value="">-- Select Connection --</option>';

      if (!Array.isArray(configs) || configs.length === 0) return;

      configs.forEach((config) => {
        const opt = document.createElement("option");
        opt.value = config.configId;
        opt.textContent = config.dbName;
        builderConn.appendChild(opt);
      });

      builderConn.disabled = false;
      saveBuilderState();
    } catch (err) {
      showAlert(builderAlert, "Failed to load connections.", "alert-error");
    }
  });

  builderConn.addEventListener("change", async () => {
    builderConfigId = parseInt(builderConn.value, 10);
    resetBuilderFromStep2();
    clearBuilderState();

    if (!builderConfigId) return;

    try {
      const tables = await getSchemaTables(builderConfigId);
      allTables = tables;

      builderTableSel.innerHTML = '<option value="">-- Select Table --</option>';
      tables.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        builderTableSel.appendChild(opt);
      });

      enableBuilderStep(builderStep2);
      saveBuilderState();
    } catch (err) {
      showAlert(builderAlert, "Failed to load tables.", "alert-error");
    }
  });

  builderTableSel.addEventListener("change", async () => {
    builderTable = builderTableSel.value;
    joinRowsEl.innerHTML = "";
    whereRowsEl.innerHTML = "";
    joinCount = 0;
    whereCount = 0;

    if (!builderTable) {
      resetBuilderFromStep2();
      return;
    }

    try {
      const columns = await getSchemaColumns(builderConfigId, builderTable);
      builderColumns = columns;
      columnCheckboxes.innerHTML = "";
      columns.forEach((col) => {
        const item = document.createElement("label");
        item.className = "column-checkbox-item";
        item.innerHTML = `
          <input type="checkbox" class="col-checkbox" value="${col}" />
          ${col}
        `;
        item.querySelector("input").addEventListener("change", generateSQL);
        columnCheckboxes.appendChild(item);
      });

      enableBuilderStep(builderStep3);
      enableBuilderStep(builderStep4);
      enableBuilderStep(builderStep5);
      enableBuilderStep(builderStep6);
      saveBuilderState();
      generateSQL();
    } catch (err) {
      showAlert(builderAlert, "Failed to load columns.", "alert-error");
    }
  });

  addJoinBtn.addEventListener("click", addJoinRow);
  addWhereBtn.addEventListener("click", addWhereRow);

  useQueryBtn.addEventListener("click", () => {
    const sql = generatedSql.innerText || generatedSql.textContent;

    if (!sql || sql.includes("Select a table")) {
      showAlert(builderAlert, "Please select a table first.", "alert-error");
      return;
    }

    queryTextArea.value = sql.trim();

    if (builderDbTypeEl.value) {
      dbTypeSelect.value = builderDbTypeEl.value;
      loadTestConnections(builderDbTypeEl.value);
      saveFormState();
    }

    builderToggle.classList.remove("open");
    builderBody.classList.remove("open");

    document.getElementById("queryName").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    setTimeout(() => queryNameInput.focus(), 400);
  });

  resetBuilderBtn.addEventListener("click", () => {
    builderDbTypeEl.value = "";
    builderConn.innerHTML = '<option value="">-- Select DB Type first --</option>';
    builderConn.disabled = true;
    builderConfigId = null;
    builderTable = null;
    builderColumns = [];
    allTables = [];
    clearBuilderState();
    hideAlert(builderAlert);
    resetBuilderFromStep2();
  });

  async function init() {
    restoreFormState();
    await loadDbTypes();
    await restoreBuilderState();
    await loadQueries();
  }

  init();
}
