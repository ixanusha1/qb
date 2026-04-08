import {
  deleteDbConfig,
  getAllDbConfigs,
  getConfigsByDbType,
  saveDbConfig,
  testConnection
} from "./api.js";

let connectionTested = false;
let dbNameInput;
let dbTypeSelect;
let hostInput;
let portInput;
let dbNameInput2;
let usernameInput;
let passwordInput;
let testBtn;
let saveBtn;
let formAlert;
let tableAlert;
let tableSpinner;
let configTableBody;
let emptyState;
let tableWrapper;
let configModalOverlay;
let openConfigModalBtn;
let configModalCloseBtn;
const DB_CONFIG_FORM_STATE_KEY = "db_config_form_state";
const DB_CONFIG_MODAL_OPEN_KEY = "db_config_modal_open";

const DB_TYPE_DEFAULTS = {
  MSSQL: {
    dbName: "MSSQL Connection",
    host: "localhost",
    port: "1433",
    databaseName: "master",
    username: "sa"
  },
  MYSQL: {
    dbName: "MySQL Connection",
    host: "localhost",
    port: "3306",
    databaseName: "mysql",
    username: "root"
  },
  POSTGRESQL: {
    dbName: "PostgreSQL Connection",
    host: "localhost",
    port: "5432",
    databaseName: "postgres",
    username: "postgres"
  }
};

function showAlert(element, message, type) {
  element.textContent = message;
  element.className = `alert ${type} show`;
}

function hideAlert(element) {
  element.className = "alert";
  element.textContent = "";
}

function getFormData() {
  return {
    dbName: dbNameInput.value.trim(),
    dbType: dbTypeSelect.value.trim(),
    host: hostInput.value.trim(),
    port: parseInt(portInput.value.trim(), 10),
    databaseName: dbNameInput2.value.trim(),
    username: usernameInput.value.trim(),
    password: passwordInput.value.trim()
  };
}

function validateForm(data) {
  if (!data.dbName) return "Configuration name is required.";
  if (!data.dbType) return "Please select a database type.";
  if (!data.host) return "Host is required.";
  if (!data.port || data.port <= 0) return "Port must be a positive number.";
  if (!data.databaseName) return "Database name is required.";
  if (!data.username) return "Username is required.";
  if (!data.password) return "Password is required.";
  return null;
}

function resetForm() {
  dbNameInput.value = "";
  dbTypeSelect.value = "";
  hostInput.value = "";
  portInput.value = "";
  dbNameInput2.value = "";
  usernameInput.value = "";
  passwordInput.value = "";
  connectionTested = false;
  saveBtn.disabled = true;
  clearPersistedFormState();
}

function applyConfigValues(config, { preserveDbName = false } = {}) {
  if (!config) return;

  if (!preserveDbName || !dbNameInput.value.trim()) {
    dbNameInput.value = config.dbName || "";
  }
  hostInput.value = config.host || "";
  portInput.value = config.port || "";
  dbNameInput2.value = config.databaseName || "";
  usernameInput.value = config.username || "";
  passwordInput.value = "";
  persistFormState();
}

function applyDefaultsForType(dbType) {
  const defaults = DB_TYPE_DEFAULTS[dbType];
  if (!defaults) return;

  applyConfigValues(defaults);
}

function getLatestConfig(configs) {
  return [...configs].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  })[0];
}

async function autofillByDbType(dbType) {
  connectionTested = false;
  saveBtn.disabled = true;
  hideAlert(formAlert);

  if (!dbType) {
    hostInput.value = "";
    portInput.value = "";
    dbNameInput2.value = "";
    usernameInput.value = "";
    passwordInput.value = "";
    persistFormState();
    return;
  }

  applyDefaultsForType(dbType);

  try {
    const configs = await getConfigsByDbType(dbType);
    if (Array.isArray(configs) && configs.length > 0) {
      applyConfigValues(getLatestConfig(configs), { preserveDbName: true });
      showAlert(
        formAlert,
        "Details loaded from the latest saved configuration for this database type. Enter the password and test the connection.",
        "alert-info"
      );
      return;
    }
  } catch (err) {
    // No saved config for this DB type; keep local defaults.
  }

  showAlert(
    formAlert,
    "Default connection details loaded for the selected database type. Enter the password and test the connection.",
    "alert-info"
  );
}

function getPersistedFormState() {
  try {
    const raw = sessionStorage.getItem(DB_CONFIG_FORM_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function persistFormState() {
  const state = {
    dbName: dbNameInput.value,
    dbType: dbTypeSelect.value,
    host: hostInput.value,
    port: portInput.value,
    databaseName: dbNameInput2.value,
    username: usernameInput.value,
    password: passwordInput.value
  };

  sessionStorage.setItem(DB_CONFIG_FORM_STATE_KEY, JSON.stringify(state));
}

function restoreFormState() {
  const state = getPersistedFormState();
  if (!state) return;

  dbNameInput.value = state.dbName || "";
  dbTypeSelect.value = state.dbType || "";
  hostInput.value = state.host || "";
  portInput.value = state.port || "";
  dbNameInput2.value = state.databaseName || "";
  usernameInput.value = state.username || "";
  passwordInput.value = state.password || "";
}

function clearPersistedFormState() {
  sessionStorage.removeItem(DB_CONFIG_FORM_STATE_KEY);
}

function persistModalOpenState(isOpen) {
  if (isOpen) {
    sessionStorage.setItem(DB_CONFIG_MODAL_OPEN_KEY, "true");
  } else {
    sessionStorage.removeItem(DB_CONFIG_MODAL_OPEN_KEY);
  }
}

function openConfigModal() {
  configModalOverlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
  persistModalOpenState(true);
}

function closeConfigModal() {
  configModalOverlay.classList.remove("is-open");
  document.body.style.overflow = "";
  persistModalOpenState(false);
}

async function loadConfigs() {
  tableSpinner.classList.add("show");
  tableWrapper.style.display = "none";
  emptyState.style.display = "none";
  hideAlert(tableAlert);

  try {
    const configs = await getAllDbConfigs();

    if (!Array.isArray(configs) || configs.length === 0) {
      emptyState.style.display = "block";
    } else {
      renderTable(configs);
      tableWrapper.style.display = "block";
    }
  } catch (err) {
    showAlert(tableAlert, "Failed to load configurations.", "alert-error");
  } finally {
    tableSpinner.classList.remove("show");
  }
}

function renderTable(configs) {
  configTableBody.innerHTML = "";

  configs.forEach((config, index) => {
    const createdAt = config.createdAt
      ? new Date(config.createdAt).toLocaleString()
      : "-";

    const row = document.createElement("tr");

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.style.padding = "6px 14px";
    deleteBtn.style.fontSize = "12px";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDelete(config.configId));

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${config.dbName}</td>
      <td><span class="badge badge-info">${config.dbType}</span></td>
      <td>${config.host}</td>
      <td>${config.port}</td>
      <td>${config.databaseName}</td>
      <td>${config.username}</td>
      <td>${createdAt}</td>
      <td></td>
    `;

    row.querySelector("td:last-child").appendChild(deleteBtn);
    configTableBody.appendChild(row);
  });
}

async function handleDelete(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this configuration?"
  );
  if (!confirmed) return;

  try {
    const response = await deleteDbConfig(id);

    if (response.ok || response.status === 204) {
      showAlert(
        tableAlert,
        "Configuration deleted successfully.",
        "alert-success"
      );
      loadConfigs();
    } else {
      const result = await response.json();
      showAlert(tableAlert, result.error || "Failed to delete.", "alert-error");
    }
  } catch (err) {
    showAlert(tableAlert, "Something went wrong while deleting.", "alert-error");
  }
}

export function initDbConfigPage() {
  dbNameInput = document.getElementById("dbName");
  dbTypeSelect = document.getElementById("dbType");
  hostInput = document.getElementById("host");
  portInput = document.getElementById("port");
  dbNameInput2 = document.getElementById("databaseName");
  usernameInput = document.getElementById("username");
  passwordInput = document.getElementById("password");
  testBtn = document.getElementById("testBtn");
  saveBtn = document.getElementById("saveBtn");
  formAlert = document.getElementById("formAlert");
  tableAlert = document.getElementById("tableAlert");
  tableSpinner = document.getElementById("tableSpinner");
  configTableBody = document.getElementById("configTableBody");
  emptyState = document.getElementById("emptyState");
  tableWrapper = document.getElementById("tableWrapper");
  configModalOverlay = document.getElementById("configModalOverlay");
  openConfigModalBtn = document.getElementById("openConfigModalBtn");
  configModalCloseBtn = document.getElementById("configModalCloseBtn");

  if (!dbNameInput) return;

  if (openConfigModalBtn && configModalOverlay) {
    openConfigModalBtn.addEventListener("click", openConfigModal);
  }

  if (configModalCloseBtn && configModalOverlay) {
    configModalCloseBtn.addEventListener("click", closeConfigModal);
  }

  if (configModalOverlay) {
    configModalOverlay.addEventListener("click", (event) => {
      if (event.target === configModalOverlay) {
        closeConfigModal();
      }
    });
  }

  [
    dbNameInput,
    dbTypeSelect,
    hostInput,
    portInput,
    dbNameInput2,
    usernameInput,
    passwordInput
  ].forEach((el) => {
    el.addEventListener("input", () => {
      connectionTested = false;
      saveBtn.disabled = true;
      hideAlert(formAlert);
      persistFormState();
    });
  });

  dbTypeSelect.addEventListener("change", (event) => {
    autofillByDbType(event.target.value.trim());
    persistFormState();
  });

  testBtn.addEventListener("click", async () => {
    hideAlert(formAlert);
    const data = getFormData();
    const error = validateForm(data);

    if (error) {
      showAlert(formAlert, error, "alert-error");
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = "Testing...";

    try {
      const result = await testConnection(data);

      if (result.success) {
        showAlert(
          formAlert,
          "Connection successful. You can now save.",
          "alert-success"
        );
        connectionTested = true;
        saveBtn.disabled = false;
        persistFormState();
      } else {
        showAlert(
          formAlert,
          "Connection failed. Please check your details.",
          "alert-error"
        );
        connectionTested = false;
        saveBtn.disabled = true;
      }
    } catch (err) {
      showAlert(
        formAlert,
        "Could not reach the backend. Is Spring Boot running?",
        "alert-error"
      );
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    }
  });

  saveBtn.addEventListener("click", async () => {
    hideAlert(formAlert);

    if (!connectionTested) {
      showAlert(
        formAlert,
        "Please test the connection before saving.",
        "alert-error"
      );
      return;
    }

    const data = getFormData();
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const result = await saveDbConfig(data);

      if (result.configId) {
        showAlert(formAlert, "Configuration saved successfully.", "alert-success");
        resetForm();
        loadConfigs();
        if (configModalOverlay) {
          closeConfigModal();
        }
      } else {
        const message = result.error || "Failed to save configuration.";
        showAlert(formAlert, message, "alert-error");
      }
    } catch (err) {
      showAlert(formAlert, "Something went wrong. Please try again.", "alert-error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Configuration";
    }
  });

  restoreFormState();
  if (sessionStorage.getItem(DB_CONFIG_MODAL_OPEN_KEY) === "true") {
    openConfigModal();
  }

  loadConfigs();
}
