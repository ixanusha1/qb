// ── Element References ──
const queryNameInput = document.getElementById("queryName");
const dbTypeSelect = document.getElementById("dbType");
const descriptionInput = document.getElementById("description");
const queryTextArea = document.getElementById("queryText");
const saveQueryBtn = document.getElementById("saveQueryBtn");
const clearBtn = document.getElementById("clearBtn");
const formAlert = document.getElementById("formAlert");
const tableAlert = document.getElementById("tableAlert");
const tableSpinner = document.getElementById("tableSpinner");
const queryTableBody = document.getElementById("queryTableBody");
const emptyState = document.getElementById("emptyState");
const tableWrapper = document.getElementById("tableWrapper");
const filterDbType = document.getElementById("filterDbType");

// ─────────────────────────────────────────
// Utility — Show / Hide Alert
// ─────────────────────────────────────────
function showAlert(element, message, type) {
  element.textContent = message;
  element.className = `alert ${type} show`;
}

function hideAlert(element) {
  element.className = "alert";
  element.textContent = "";
}

// ─────────────────────────────────────────
// Utility — Frontend Validation
// ─────────────────────────────────────────
function validateForm(data) {
  if (!data.name) return "Query name is required.";
  if (!data.dbType) return "Please select a database type.";
  if (!data.queryText) return "SQL query cannot be empty.";
  return null;
}

// ─────────────────────────────────────────
// Populate DB Type Dropdowns
// (both the form dropdown and filter dropdown)
// ─────────────────────────────────────────
async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();

    // Clear existing options except the placeholder
    dbTypeSelect.innerHTML = '<option value="">-- Select Type --</option>';
    filterDbType.innerHTML = '<option value="">-- All Types --</option>';

    if (!Array.isArray(types) || types.length === 0) {
      // No configs saved yet — warn the user
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No DB configs found — add one first";
      option.disabled = true;
      dbTypeSelect.appendChild(option);
      return;
    }

    types.forEach((type) => {
      // Add to form dropdown
      const opt1 = document.createElement("option");
      opt1.value = type;
      opt1.textContent = type;
      dbTypeSelect.appendChild(opt1);

      // Add to filter dropdown
      const opt2 = document.createElement("option");
      opt2.value = type;
      opt2.textContent = type;
      filterDbType.appendChild(opt2);
    });
  } catch (err) {
    showAlert(
      formAlert,
      "Failed to load DB types. Is the backend running?",
      "alert-error",
    );
  }
}

// ─────────────────────────────────────────
// Save Query
// ─────────────────────────────────────────
saveQueryBtn.addEventListener("click", async () => {
  hideAlert(formAlert);

  const data = {
    name: queryNameInput.value.trim(),
    dbType: dbTypeSelect.value.trim(),
    description: descriptionInput.value.trim(),
    queryText: queryTextArea.value.trim(),
  };

  // Frontend validation
  const error = validateForm(data);
  if (error) {
    showAlert(formAlert, error, "alert-error");
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
        "alert-success",
      );
      resetForm();
      loadQueries();
    } else {
      // Backend returned an error (validation failure, duplicate name, etc.)
      const message = result.error || "Failed to save query.";
      showAlert(formAlert, message, "alert-error");
    }
  } catch (err) {
    showAlert(
      formAlert,
      "Something went wrong. Please try again.",
      "alert-error",
    );
  } finally {
    saveQueryBtn.disabled = false;
    saveQueryBtn.textContent = "Save Query";
  }
});

// ─────────────────────────────────────────
// Clear Form
// ─────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  resetForm();
  hideAlert(formAlert);
});

function resetForm() {
  queryNameInput.value = "";
  dbTypeSelect.value = "";
  descriptionInput.value = "";
  queryTextArea.value = "";
}

// ─────────────────────────────────────────
// Filter Queries by DB Type
// ─────────────────────────────────────────
filterDbType.addEventListener("change", () => {
  loadQueries();
});

// ─────────────────────────────────────────
// Load and Render Saved Queries
// ─────────────────────────────────────────
async function loadQueries() {
  tableSpinner.classList.add("show");
  tableWrapper.style.display = "none";
  emptyState.style.display = "none";
  hideAlert(tableAlert);

  try {
    const selectedType = filterDbType.value;

    // Fetch filtered or all queries based on dropdown
    const queries = selectedType
      ? await getQueriesByDbType(selectedType)
      : await getAllQueries();

    if (!Array.isArray(queries) || queries.length === 0) {
      emptyState.style.display = "block";
      emptyState.textContent = selectedType
        ? `No queries found for DB type "${selectedType}".`
        : "No queries saved yet. Add one above.";
    } else {
      renderTable(queries);
      tableWrapper.style.display = "block";
    }
  } catch (err) {
    showAlert(tableAlert, "Failed to load queries.", "alert-error");
  } finally {
    tableSpinner.classList.remove("show");
  }
}

// ─────────────────────────────────────────
// Render Table Rows
// ─────────────────────────────────────────
function renderTable(queries) {
  queryTableBody.innerHTML = "";

  queries.forEach((query, index) => {
    const createdAt = query.createdAt
      ? new Date(query.createdAt).toLocaleString()
      : "—";

    // Truncate long query text for preview
    const preview =
      query.queryText.length > 60
        ? query.queryText.substring(0, 60) + "..."
        : query.queryText;

    const description = query.description
      ? query.description
      : '<span style="color:#999;">—</span>';

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${query.name}</strong></td>
            <td>${description}</td>
            <td><span class="badge badge-info">${query.dbType}</span></td>
            <td>
                <code style="
                    background:#f0f2f5;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #1e3a5f;
                ">${preview}</code>
            </td>
            <td>${createdAt}</td>
            <td>
                <button
                    class="btn btn-danger"
                    style="padding: 6px 14px; font-size: 12px;"
                    onclick="handleDelete(${query.queryId}, '${query.name}')">
                    Delete
                </button>
            </td>
        `;
    queryTableBody.appendChild(row);
  });
}

// ─────────────────────────────────────────
// Delete Query
// ─────────────────────────────────────────
async function handleDelete(id, name) {
  const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
  if (!confirmed) return;

  try {
    const response = await deleteQuery(id);

    if (response.ok || response.status === 204) {
      showAlert(
        tableAlert,
        `Query "${name}" deleted successfully.`,
        "alert-success",
      );
      loadQueries();
    } else {
      const result = await response.json();
      showAlert(
        tableAlert,
        result.error || "Failed to delete query.",
        "alert-error",
      );
    }
  } catch (err) {
    showAlert(
      tableAlert,
      "Something went wrong while deleting.",
      "alert-error",
    );
  }
}

// ─────────────────────────────────────────
// Init — Load everything on page load
// ─────────────────────────────────────────
async function init() {
  await loadDbTypes();
  await loadQueries();
}

init();
