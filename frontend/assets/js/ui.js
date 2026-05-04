(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(date);
  }

  function renderLoading(label = "A carregar") {
    return `<div class="loading-state">${escapeHtml(label)}</div>`;
  }

  function renderEmpty(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function renderTable(columns, rows, emptyMessage) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return renderEmpty(emptyMessage);
    }

    const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
    const body = rows.map((row) => {
      const cells = columns.map((column) => {
        const value = typeof column.render === "function" ? column.render(row) : row[column.key];
        return `<td>${value ?? "-"}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");

    return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function notify(message, type = "success", timeout = 5200, title = "") {
    const zone = document.getElementById("noticeZone");
    if (!zone) return;

    const element = document.createElement("div");
    element.className = `toast toast-${type}`;
    const titleHtml = title ? `<strong class="toast-title">${escapeHtml(title)}</strong>` : "";
    element.innerHTML = `
      <div class="toast-content">
        ${titleHtml}
        <span class="toast-message">${escapeHtml(message)}</span>
      </div>
      <button type="button" class="toast-close" aria-label="Fechar notificação">×</button>
    `;
    zone.prepend(element);

    const closeButton = element.querySelector(".toast-close");
    const closeToast = () => {
      element.classList.add("is-leaving");
      window.setTimeout(() => element.remove(), 220);
    };
    closeButton.addEventListener("click", closeToast);

    if (timeout) {
      window.setTimeout(closeToast, timeout);
    }
  }

  function formData(form) {
    const data = new FormData(form);
    const payload = {};

    for (const [key, value] of data.entries()) {
      if (value === "") continue;
      payload[key] = value;
    }

    for (const element of form.elements) {
      if (element.type === "checkbox" && element.name) {
        payload[element.name] = element.checked;
      }
    }

    return payload;
  }

  function normalizeSearch(value) {
    return String(value ?? "").toLocaleLowerCase("pt-PT");
  }

  function matchesSearch(row, term, fields) {
    const needle = normalizeSearch(term).trim();
    if (!needle) return true;
    return fields.some((field) => normalizeSearch(row[field]).includes(needle));
  }

  window.BibliotecaUi = {
    escapeHtml,
    formatDate,
    renderLoading,
    renderEmpty,
    renderTable,
    notify,
    formData,
    matchesSearch
  };
})();
