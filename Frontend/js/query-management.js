// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let allQueries            = [];
let builderConfigId       = null;
let builderSelectedDbType = null;     // ← renamed from builderDbType
let builderTable          = null;
let builderColumns        = [];
let allTables             = [];
let joinCount             = 0;
let whereCount            = 0;

// ─────────────────────────────────────────
// ELEMENT REFERENCES
// ─────────────────────────────────────────
const queryNameInput    = document.getElementById('queryName');
const dbTypeSelect      = document.getElementById('dbType');
const descriptionInput  = document.getElementById('description');
const queryTextArea     = document.getElementById('queryText');
const saveQueryBtn      = document.getElementById('saveQueryBtn');
const clearBtn          = document.getElementById('clearBtn');
const formAlert         = document.getElementById('formAlert');
const tableAlert        = document.getElementById('tableAlert');
const tableSpinner      = document.getElementById('tableSpinner');
const queryTableBody    = document.getElementById('queryTableBody');
const emptyState        = document.getElementById('emptyState');
const tableWrapper      = document.getElementById('tableWrapper');
const filterDbType      = document.getElementById('filterDbType');
const searchInput       = document.getElementById('searchInput');
const searchCount       = document.getElementById('searchCount');

// Builder elements
const builderToggle     = document.getElementById('builderToggle');
const builderBody       = document.getElementById('builderBody');
const builderAlert      = document.getElementById('builderAlert');
const builderDbTypeEl   = document.getElementById('builderDbType');   // ← renamed
const builderConn       = document.getElementById('builderConnection');
const builderTableSel   = document.getElementById('builderTable');
const columnCheckboxes  = document.getElementById('columnCheckboxes');
const joinRowsEl        = document.getElementById('joinRows');
const whereRowsEl       = document.getElementById('whereRows');
const addJoinBtn        = document.getElementById('addJoinBtn');
const addWhereBtn       = document.getElementById('addWhereBtn');
const generatedSql      = document.getElementById('generatedSql');
const useQueryBtn       = document.getElementById('useQueryBtn');
const resetBuilderBtn   = document.getElementById('resetBuilderBtn');

// Builder step sections
const builderStep2      = document.getElementById('builderStep2');
const builderStep3      = document.getElementById('builderStep3');
const builderStep4      = document.getElementById('builderStep4');
const builderStep5      = document.getElementById('builderStep5');
const builderStep6      = document.getElementById('builderStep6');

// ─────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────
function showAlert(el, message, type) {
  el.textContent = message;
  el.className   = `alert ${type} show`;
}

function hideAlert(el) {
  el.className   = 'alert';
  el.textContent = '';
}

function enableBuilderStep(step) {
  step.style.opacity       = '1';
  step.style.pointerEvents = 'auto';
}

function disableBuilderStep(step) {
  step.style.opacity       = '0.4';
  step.style.pointerEvents = 'none';
}

// ─────────────────────────────────────────
// INIT — Load DB types into all dropdowns
// ─────────────────────────────────────────
async function loadDbTypes() {
  try {
    const types = await getAllDbTypes();

    dbTypeSelect.innerHTML   = '<option value="">-- Select Type --</option>';
    filterDbType.innerHTML   = '<option value="">-- All Types --</option>';
    builderDbTypeEl.innerHTML = '<option value="">-- Select DB Type --</option>';

    if (!Array.isArray(types) || types.length === 0) return;

    types.forEach(type => {
      [dbTypeSelect, filterDbType, builderDbTypeEl].forEach(sel => {
        const opt       = document.createElement('option');
        opt.value       = type;
        opt.textContent = type;
        sel.appendChild(opt);
      });
    });

  } catch (err) {
    showAlert(formAlert, 'Failed to load DB types. Is the backend running?', 'alert-error');
  }
}

// ─────────────────────────────────────────
// BUILDER — Toggle open/close
// ─────────────────────────────────────────
builderToggle.addEventListener('click', () => {
  builderToggle.classList.toggle('open');
  builderBody.classList.toggle('open');
});

// ─────────────────────────────────────────
// BUILDER — Step 1a: DB Type selected
// ─────────────────────────────────────────
builderDbTypeEl.addEventListener('change', async () => {
  hideAlert(builderAlert);
  builderConn.innerHTML       = '<option value="">-- Loading... --</option>';
  builderConn.disabled        = true;
  builderConfigId             = null;
  builderSelectedDbType       = builderDbTypeEl.value;
  resetBuilderFromStep2();

  if (!builderDbTypeEl.value) {
    builderConn.innerHTML = '<option value="">-- Select DB Type first --</option>';
    return;
  }

  try {
    const configs = await getConfigsByDbType(builderDbTypeEl.value);
    builderConn.innerHTML = '<option value="">-- Select Connection --</option>';

    if (!Array.isArray(configs) || configs.length === 0) {
      builderConn.innerHTML =
          `<option value="" disabled>No connections found</option>`;
      return;
    }

    configs.forEach(c => {
      const opt       = document.createElement('option');
      opt.value       = c.configId;
      opt.textContent = c.dbName;
      builderConn.appendChild(opt);
    });

    builderConn.disabled = false;

  } catch (err) {
    showAlert(builderAlert, 'Failed to load connections.', 'alert-error');
  }
});

// ─────────────────────────────────────────
// BUILDER — Step 1b: Connection selected
// ─────────────────────────────────────────
builderConn.addEventListener('change', async () => {
  hideAlert(builderAlert);
  resetBuilderFromStep2();

  if (!builderConn.value) return;

  builderConfigId = parseInt(builderConn.value);
  builderTableSel.innerHTML = '<option value="">-- Loading tables... --</option>';
  enableBuilderStep(builderStep2);

  try {
    const tables = await getSchemaTables(builderConfigId);
    allTables    = tables;

    builderTableSel.innerHTML = '<option value="">-- Select Table --</option>';
    tables.forEach(t => {
      const opt       = document.createElement('option');
      opt.value       = t;
      opt.textContent = t;
      builderTableSel.appendChild(opt);
    });

  } catch (err) {
    showAlert(builderAlert, 'Failed to load tables.', 'alert-error');
    disableBuilderStep(builderStep2);
  }
});

// ─────────────────────────────────────────
// BUILDER — Step 2: Table selected
// ─────────────────────────────────────────
builderTableSel.addEventListener('change', async () => {
  hideAlert(builderAlert);
  builderTable = builderTableSel.value;

  columnCheckboxes.innerHTML = '<span style="color:#888;font-size:13px;">Loading columns...</span>';
  joinRowsEl.innerHTML       = '';
  whereRowsEl.innerHTML      = '';
  joinCount                  = 0;
  whereCount                 = 0;

  disableBuilderStep(builderStep3);
  disableBuilderStep(builderStep4);
  disableBuilderStep(builderStep5);
  disableBuilderStep(builderStep6);

  if (!builderTable) return;

  try {
    const columns  = await getSchemaColumns(builderConfigId, builderTable);
    builderColumns = columns;

    columnCheckboxes.innerHTML = '';
    columns.forEach(col => {
      const item     = document.createElement('label');
      item.className = 'column-checkbox-item';
      item.innerHTML = `
                <input type="checkbox" class="col-checkbox" value="${col}" />
                ${col}
            `;
      item.querySelector('input').addEventListener('change', generateSQL);
      columnCheckboxes.appendChild(item);
    });

    enableBuilderStep(builderStep3);
    enableBuilderStep(builderStep4);
    enableBuilderStep(builderStep5);
    enableBuilderStep(builderStep6);

    generateSQL();

  } catch (err) {
    showAlert(builderAlert, 'Failed to load columns.', 'alert-error');
    columnCheckboxes.innerHTML =
        '<span style="color:#888;font-size:13px;">Failed to load columns.</span>';
  }
});

// ─────────────────────────────────────────
// BUILDER — Add JOIN row
// ─────────────────────────────────────────
addJoinBtn.addEventListener('click', () => {
  joinCount++;
  const id  = `join_${joinCount}`;
  const row = document.createElement('div');
  row.className = 'join-row';
  row.id        = id;

  const tableOptions = allTables.map(t =>
      `<option value="${t}">${t}</option>`
  ).join('');

  row.innerHTML = `
        <select class="join-type" onchange="generateSQL()">
            <option value="INNER JOIN">INNER JOIN</option>
            <option value="LEFT JOIN">LEFT JOIN</option>
            <option value="RIGHT JOIN">RIGHT JOIN</option>
        </select>
        <select class="join-table" onchange="handleJoinTableChange('${id}')">
            <option value="">-- Table --</option>
            ${tableOptions}
        </select>
        <select class="join-on-left" onchange="generateSQL()">
            <option value="">-- Left column --</option>
            ${builderColumns.map(c =>
      `<option value="${builderTable}.${c}">${builderTable}.${c}</option>`
  ).join('')}
        </select>
        <select class="join-on-right" onchange="generateSQL()">
            <option value="">-- Right column --</option>
        </select>
        <button class="remove-btn" onclick="removeRow('${id}')">✕</button>
    `;

  joinRowsEl.appendChild(row);
});

async function handleJoinTableChange(rowId) {
  const row       = document.getElementById(rowId);
  const joinTable = row.querySelector('.join-table').value;
  const rightSel  = row.querySelector('.join-on-right');

  rightSel.innerHTML = '<option value="">-- Loading... --</option>';

  if (!joinTable) {
    rightSel.innerHTML = '<option value="">-- Right column --</option>';
    generateSQL();
    return;
  }

  try {
    const cols = await getSchemaColumns(builderConfigId, joinTable);
    rightSel.innerHTML = '<option value="">-- Right column --</option>';
    cols.forEach(c => {
      const opt       = document.createElement('option');
      opt.value       = `${joinTable}.${c}`;
      opt.textContent = `${joinTable}.${c}`;
      rightSel.appendChild(opt);
    });
  } catch (err) {
    rightSel.innerHTML = '<option value="">-- Failed to load --</option>';
  }

  generateSQL();
}

// ─────────────────────────────────────────
// BUILDER — Add WHERE row
// ─────────────────────────────────────────
addWhereBtn.addEventListener('click', () => {
  whereCount++;
  const id  = `where_${whereCount}`;
  const row = document.createElement('div');
  row.className = 'where-row';
  row.id        = id;

  const allColumnOptions = builderColumns.map(c =>
      `<option value="${builderTable}.${c}">${builderTable}.${c}</option>`
  ).join('');

  row.innerHTML = `
        <select class="where-column" onchange="generateSQL()">
            <option value="">-- Column --</option>
            ${allColumnOptions}
        </select>
        <select class="where-operator" onchange="generateSQL()">
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
        <input type="text" class="where-value"
            placeholder="value" oninput="generateSQL()" />
        <button class="remove-btn" onclick="removeRow('${id}')">✕</button>
    `;

  whereRowsEl.appendChild(row);
  generateSQL();
});

// ─────────────────────────────────────────
// BUILDER — Remove row
// ─────────────────────────────────────────
function removeRow(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
  generateSQL();
}

// ─────────────────────────────────────────
// BUILDER — Generate SQL live
// ─────────────────────────────────────────
function generateSQL() {
  if (!builderTable) return;

  const checked    = [...document.querySelectorAll('.col-checkbox:checked')]
      .map(cb => cb.value);
  const columnPart = checked.length > 0 ? checked.join(', ') : '*';

  const joinClauses = [];
  document.querySelectorAll('.join-row').forEach(row => {
    const type  = row.querySelector('.join-type')?.value;
    const table = row.querySelector('.join-table')?.value;
    const left  = row.querySelector('.join-on-left')?.value;
    const right = row.querySelector('.join-on-right')?.value;
    if (type && table && left && right) {
      joinClauses.push(`${type} ${table} ON ${left} = ${right}`);
    }
  });

  const whereClauses = [];
  document.querySelectorAll('.where-row').forEach(row => {
    const col      = row.querySelector('.where-column')?.value;
    const operator = row.querySelector('.where-operator')?.value;
    const value    = row.querySelector('.where-value')?.value.trim();

    if (col && operator) {
      if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        whereClauses.push(`${col} ${operator}`);
      } else if (value) {
        const isNumeric = !isNaN(value) && value !== '';
        const formatted = isNumeric ? value : `'${value}'`;
        whereClauses.push(`${col} ${operator} ${formatted}`);
      }
    }
  });

  let sql = `SELECT ${columnPart}\nFROM ${builderTable}`;
  if (joinClauses.length > 0)  sql += '\n' + joinClauses.join('\n');
  if (whereClauses.length > 0) sql += '\nWHERE ' + whereClauses.join('\n  AND ');

  generatedSql.innerHTML = syntaxHighlight(sql);
}

function syntaxHighlight(sql) {
  return sql
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|INNER JOIN|LEFT JOIN|RIGHT JOIN|ON|IS NULL|IS NOT NULL|LIKE)\b/g,
          '<span class="sql-keyword">$1</span>')
      .replace(/\*/g, '<span class="sql-column">*</span>');
}

// ─────────────────────────────────────────
// BUILDER — Use This Query
// ─────────────────────────────────────────
useQueryBtn.addEventListener('click', () => {
  const sql = generatedSql.innerText || generatedSql.textContent;

  if (!sql || sql.includes('Select a table')) {
    showAlert(builderAlert, 'Please select a table first.', 'alert-error');
    return;
  }

  queryTextArea.value = sql.trim();

  if (builderDbTypeEl.value) {
    dbTypeSelect.value = builderDbTypeEl.value;
  }

  builderToggle.classList.remove('open');
  builderBody.classList.remove('open');

  document.getElementById('queryName').scrollIntoView({
    behavior: 'smooth', block: 'start'
  });

  setTimeout(() => queryNameInput.focus(), 400);
});

// ─────────────────────────────────────────
// BUILDER — Reset
// ─────────────────────────────────────────
resetBuilderBtn.addEventListener('click', () => {
  builderDbTypeEl.value  = '';
  builderConn.innerHTML  = '<option value="">-- Select DB Type first --</option>';
  builderConn.disabled   = true;
  builderConfigId        = null;
  builderTable           = null;
  builderColumns         = [];
  allTables              = [];
  hideAlert(builderAlert);
  resetBuilderFromStep2();
});

function resetBuilderFromStep2() {
  builderTableSel.innerHTML  = '<option value="">-- Select a connection first --</option>';
  columnCheckboxes.innerHTML =
      '<span style="color:#888;font-size:13px;">Select a table to see columns</span>';
  joinRowsEl.innerHTML       = '';
  whereRowsEl.innerHTML      = '';
  joinCount                  = 0;
  whereCount                 = 0;
  generatedSql.innerHTML     = 'Select a table to generate SQL...';
  builderTable               = null;
  builderColumns             = [];

  disableBuilderStep(builderStep2);
  disableBuilderStep(builderStep3);
  disableBuilderStep(builderStep4);
  disableBuilderStep(builderStep5);
  disableBuilderStep(builderStep6);
}

// ─────────────────────────────────────────
// SAVE QUERY FORM
// ─────────────────────────────────────────
saveQueryBtn.addEventListener('click', async () => {
  hideAlert(formAlert);

  const data = {
    name       : queryNameInput.value.trim(),
    dbType     : dbTypeSelect.value.trim(),
    description: descriptionInput.value.trim(),
    queryText  : queryTextArea.value.trim()
  };

  if (!data.name)      { showAlert(formAlert, 'Query name is required.', 'alert-error'); return; }
  if (!data.dbType)    { showAlert(formAlert, 'Please select a database type.', 'alert-error'); return; }
  if (!data.queryText) { showAlert(formAlert, 'SQL query cannot be empty.', 'alert-error'); return; }

  saveQueryBtn.disabled    = true;
  saveQueryBtn.textContent = 'Saving...';

  try {
    const result = await saveQuery(data);

    if (result.queryId) {
      showAlert(formAlert, `Query "${result.name}" saved successfully.`, 'alert-success');
      resetForm();
      await loadQueries();
    } else {
      showAlert(formAlert, result.error || 'Failed to save query.', 'alert-error');
    }
  } catch (err) {
    showAlert(formAlert, 'Something went wrong. Please try again.', 'alert-error');
  } finally {
    saveQueryBtn.disabled    = false;
    saveQueryBtn.textContent = 'Save Query';
  }
});

clearBtn.addEventListener('click', () => {
  resetForm();
  hideAlert(formAlert);
});

function resetForm() {
  queryNameInput.value   = '';
  dbTypeSelect.value     = '';
  descriptionInput.value = '';
  queryTextArea.value    = '';
}

// ─────────────────────────────────────────
// LIVE SEARCH
// ─────────────────────────────────────────
searchInput.addEventListener('input', () => {
  renderTable(getFilteredQueries());
});

filterDbType.addEventListener('change', () => {
  renderTable(getFilteredQueries());
});

function getFilteredQueries() {
  const term       = searchInput.value.trim().toLowerCase();
  const typeFilter = filterDbType.value;

  return allQueries.filter(q => {
    const matchesType = typeFilter ? q.dbType === typeFilter : true;
    const matchesTerm = term
        ? q.name.toLowerCase().includes(term) ||
        (q.description && q.description.toLowerCase().includes(term))
        : true;
    return matchesType && matchesTerm;
  });
}

// ─────────────────────────────────────────
// LOAD QUERIES
// ─────────────────────────────────────────
async function loadQueries() {
  tableSpinner.classList.add('show');
  tableWrapper.style.display = 'none';
  emptyState.style.display   = 'none';
  hideAlert(tableAlert);

  try {
    allQueries = await getAllQueries();
    renderTable(getFilteredQueries());
  } catch (err) {
    showAlert(tableAlert, 'Failed to load queries.', 'alert-error');
  } finally {
    tableSpinner.classList.remove('show');
  }
}

// ─────────────────────────────────────────
// RENDER TABLE
// ─────────────────────────────────────────
function renderTable(queries) {
  const term = searchInput.value.trim().toLowerCase();

  queryTableBody.innerHTML = '';

  searchCount.textContent = queries.length === allQueries.length
      ? `${allQueries.length} queries total`
      : `Showing ${queries.length} of ${allQueries.length} queries`;

  if (queries.length === 0) {
    tableWrapper.style.display = 'none';
    emptyState.style.display   = 'block';
    emptyState.textContent     = term
        ? `No queries match "${term}".`
        : 'No queries saved yet. Add one above.';
    return;
  }

  emptyState.style.display   = 'none';
  tableWrapper.style.display = 'block';

  queries.forEach((query, index) => {
    const createdAt = query.createdAt
        ? new Date(query.createdAt).toLocaleString()
        : '—';

    const preview = query.queryText.length > 60
        ? query.queryText.substring(0, 60) + '...'
        : query.queryText;

    const highlightedName = term
        ? query.name.replace(
            new RegExp(`(${term})`, 'gi'),
            '<span class="highlight">$1</span>')
        : query.name;

    const description = query.description
        ? (term
            ? query.description.replace(
                new RegExp(`(${term})`, 'gi'),
                '<span class="highlight">$1</span>')
            : query.description)
        : '<span style="color:#999;">—</span>';

    const row = document.createElement('tr');
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
            <td>
                <button class="btn btn-danger"
                    style="padding:6px 14px;font-size:12px;"
                    onclick="handleDelete(${query.queryId}, '${query.name.replace(/'/g, "\\'")}')">
                    Delete
                </button>
            </td>
        `;
    queryTableBody.appendChild(row);
  });
}

// ─────────────────────────────────────────
// DELETE QUERY
// ─────────────────────────────────────────
async function handleDelete(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  try {
    const response = await deleteQuery(id);

    if (response.ok || response.status === 204) {
      showAlert(tableAlert, `Query "${name}" deleted successfully.`, 'alert-success');
      await loadQueries();
    } else {
      const result = await response.json();
      showAlert(tableAlert, result.error || 'Failed to delete.', 'alert-error');
    }
  } catch (err) {
    showAlert(tableAlert, 'Something went wrong while deleting.', 'alert-error');
  }
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
async function init() {
  await loadDbTypes();
  await loadQueries();
}

init();