(function () {
  const api = window.BibliotecaApi;
  const ui = window.BibliotecaUi;

  const fallbackUser = {
    nome: "Bibliotecário",
    role: "BIBLIOTECARIO"
  };

  const state = {
    activeSection: "dashboard",
    currentUser: fallbackUser,
    openSheet: null,
    livros: [],
    leitores: [],
    usuarios: [],
    emprestimos: []
  };

  const titles = {
    dashboard: "Visão Geral",
    livros: "Livros",
    leitores: "Leitores",
    usuarios: "Utilizadores",
    emprestimos: "Empréstimos"
  };

  const elements = {};
  const ROLE_ADMIN = "ADMIN";
  const MESSAGES = {
    auth: {
      loginSuccess: "Sessão iniciada com sucesso.",
      loginError: "Não foi possível iniciar sessão.",
      logout: "Sessão terminada.",
      expired: "A sessão expirou. Inicie sessão novamente."
    },
    data: {
      loadBooks: "Não foi possível carregar os livros.",
      loadReaders: "Não foi possível carregar os leitores.",
      loadUsers: "Não foi possível carregar os utilizadores.",
      loadLoans: "Não foi possível carregar os empréstimos."
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindAuth();
    bindNavigation();
    bindSheets();
    bindForms();
    bindFilters();
    restoreSession();
  }

  function cacheElements() {
    elements.authShell = document.getElementById("authShell");
    elements.appShell = document.getElementById("appShell");
    elements.loginForm = document.getElementById("loginForm");
    elements.pageTitle = document.getElementById("pageTitle");
    elements.refreshButton = document.getElementById("refreshButton");
    elements.logoutButton = document.getElementById("logoutButton");
    elements.currentUserName = document.getElementById("currentUserName");
    elements.currentUserRole = document.getElementById("currentUserRole");
    elements.sheetOverlay = document.getElementById("sheetOverlay");
    elements.metricsGrid = document.getElementById("metricsGrid");
    elements.recentBooks = document.getElementById("recentBooks");
    elements.booksTable = document.getElementById("booksTable");
    elements.readersTable = document.getElementById("readersTable");
    elements.usersTable = document.getElementById("usersTable");
    elements.loansTable = document.getElementById("loansTable");
    elements.usersNavItem = document.getElementById("usuariosNavItem");
    elements.loanReaderSelect = document.getElementById("loanReaderSelect");
    elements.loanBookSelect = document.getElementById("loanBookSelect");
  }

  function bindAuth() {
    bindSubmit("loginForm", async (form) => {
      const credentials = ui.formData(form);
      const ok = await runAuthAction(
        () => api.login(credentials),
        MESSAGES.auth.loginSuccess,
        MESSAGES.auth.loginError
      );
      if (!ok) return;
      form.reset();
      restoreSession();
    });
  }

  function restoreSession() {
    const session = api.getSession();
    if (!session || !session.token) {
      showLogin();
      return;
    }

    state.currentUser = session.usuario || fallbackUser;
    showApp();
    renderCurrentUser();
    enforceRoleAccess();
    loadAllData();
  }

  function showLogin(message) {
    state.currentUser = fallbackUser;
    elements.appShell.hidden = true;
    elements.authShell.hidden = false;
    closeSheet(false);
    renderLoadingState();
    if (message) ui.notify(message, "warning", 7000, "Atenção");
  }

  function showApp() {
    elements.authShell.hidden = true;
    elements.appShell.hidden = false;
  }

  function handleUnauthorized(message = MESSAGES.auth.expired) {
    api.clearSession();
    showLogin(message);
  }

  function bindNavigation() {
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveSection(button.dataset.section);
      });
    });

    elements.refreshButton.addEventListener("click", loadAllData);
    elements.logoutButton.addEventListener("click", () => {
      api.clearSession();
      showLogin(MESSAGES.auth.logout);
    });

    elements.metricsGrid.addEventListener("click", (event) => {
      const metric = event.target.closest("[data-metric-section]");
      if (!metric) return;
      setActiveSection(metric.dataset.metricSection);
    });

    elements.metricsGrid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const metric = event.target.closest("[data-metric-section]");
      if (!metric) return;
      event.preventDefault();
      setActiveSection(metric.dataset.metricSection);
    });
  }

  function bindSheets() {
    document.querySelectorAll("[data-open-sheet]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.openSheet === "userCreateSheet" && !isAdmin()) {
          ui.notify("Apenas administradores podem registar utilizadores.", "warning", 5200, "Acesso restrito");
          return;
        }
        if (button.dataset.openSheet === "loanCreateSheet") {
          populateLoanSelects();
        }
        openSheet(button.dataset.openSheet);
      });
    });

    document.querySelectorAll("[data-close-sheet]").forEach((button) => {
      button.addEventListener("click", closeSheet);
    });

    elements.sheetOverlay.addEventListener("click", closeSheet);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.openSheet) {
        closeSheet();
      }
    });
  }

  function openSheet(sheetId) {
    const sheet = document.getElementById(sheetId);
    if (!sheet) return;

    closeSheet(false);
    state.openSheet = sheet;
    elements.sheetOverlay.hidden = false;
    requestAnimationFrame(() => {
      document.body.classList.add("sheet-open");
      elements.sheetOverlay.classList.add("is-open");
      sheet.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
    });
  }

  function closeSheet(animate = true) {
    if (!state.openSheet) {
      elements.sheetOverlay.classList.remove("is-open");
      elements.sheetOverlay.hidden = true;
      document.body.classList.remove("sheet-open");
      return;
    }

    const sheet = state.openSheet;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    elements.sheetOverlay.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
    state.openSheet = null;

    const hideOverlay = () => {
      if (!state.openSheet) elements.sheetOverlay.hidden = true;
    };

    if (animate) {
      window.setTimeout(hideOverlay, 220);
    } else {
      hideOverlay();
    }
  }

  function setActiveSection(section) {
    if (section === "usuarios" && !isAdmin()) {
      section = "dashboard";
    }

    state.activeSection = section;
    elements.pageTitle.textContent = titles[section] || "Biblioteca";

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === section);
    });

    document.querySelectorAll(".content-section").forEach((view) => {
      view.classList.toggle("active", view.dataset.view === section);
    });
  }

  async function loadAllData() {
    if (!api.getSession()) {
      showLogin();
      return;
    }

    renderLoadingState();

    const [livros, leitores, usuarios, emprestimos] = await Promise.allSettled([
      api.getLivros(),
      api.getLeitores(),
      isAdmin() ? api.getUsuarios() : Promise.resolve([]),
      api.getEmprestimos()
    ]);

    if ([livros, leitores, usuarios, emprestimos].some((result) => result.status === "rejected" && result.reason.status === 401)) {
      handleUnauthorized();
      return;
    }

    applyResult("livros", livros, MESSAGES.data.loadBooks);
    applyResult("leitores", leitores, MESSAGES.data.loadReaders);
    applyResult("usuarios", usuarios, MESSAGES.data.loadUsers);
    applyResult("emprestimos", emprestimos, MESSAGES.data.loadLoans);

    updateCurrentUserFromApi();
    enforceRoleAccess();
    renderAll();
  }

  function applyResult(key, result, errorMessage) {
    if (result.status === "fulfilled") {
      state[key] = Array.isArray(result.value) ? result.value : [];
      if (result.value == null && key === "emprestimos") {
        ui.notify("Não existem empréstimos para apresentar.", "info", 4200, "Informação");
      }
      return;
    }

    state[key] = [];
    ui.notify(resolveErrorMessage(result.reason, errorMessage), "error", 8000, "Erro");
  }

  function updateCurrentUserFromApi() {
    const session = api.getSession();
    const apiUser = session && session.usuario ? session.usuario : state.usuarios[0];
    state.currentUser = apiUser
      ? { nome: apiUser.nome || fallbackUser.nome, role: apiUser.role || fallbackUser.role }
      : fallbackUser;
    renderCurrentUser();
    enforceRoleAccess();
  }

  function renderCurrentUser() {
    elements.currentUserName.textContent = state.currentUser.nome;
    elements.currentUserRole.textContent = state.currentUser.role;
  }

  function renderLoadingState() {
    elements.metricsGrid.innerHTML = ui.renderLoading("A carregar indicadores");
    elements.recentBooks.innerHTML = ui.renderLoading("A carregar catálogo");
    elements.booksTable.innerHTML = ui.renderLoading("A carregar livros");
    elements.readersTable.innerHTML = ui.renderLoading("A carregar leitores");
    elements.usersTable.innerHTML = ui.renderLoading("A carregar utilizadores");
    elements.loansTable.innerHTML = ui.renderLoading("A carregar empréstimos");
  }

  function isAdmin() {
    return state.currentUser && String(state.currentUser.role || "").trim().toUpperCase() === ROLE_ADMIN;
  }

  function enforceRoleAccess() {
    const canManageUsers = isAdmin();
    const userNavItems = document.querySelectorAll(".nav-item[data-section='usuarios']");
    userNavItems.forEach((item) => {
      item.hidden = !canManageUsers;
      item.style.display = canManageUsers ? "" : "none";
    });

    if (elements.usersNavItem) {
      elements.usersNavItem.hidden = !canManageUsers;
      elements.usersNavItem.style.display = canManageUsers ? "" : "none";
    }
    if (state.activeSection === "usuarios" && !canManageUsers) {
      setActiveSection("dashboard");
    }
  }

  function renderAll() {
    renderDashboard();
    renderBooks();
    renderReaders();
    renderUsers();
    renderLoans();
  }

  function renderDashboard() {
    const activeLoans = state.emprestimos.filter((item) => item.estado === "ATIVO").length;
    const returnedLoans = state.emprestimos.filter((item) => item.estado === "DEVOLVIDO").length;
    const lateLoans = state.emprestimos.filter((item) => item.estado === "ATRASADO").length;

    const metrics = [
      [state.livros.length, "Livros registados", "livros"],
      [state.leitores.length, "Leitores ativos", "leitores"],
      [activeLoans, "Ativos", "emprestimos"],
      [returnedLoans, "Devolvidos", "emprestimos"],
      [lateLoans, "Atrasados", "emprestimos"]
    ];

    elements.metricsGrid.innerHTML = metrics.map(([value, label, section]) => `
      <article class="metric metric-link" data-metric-section="${ui.escapeHtml(section)}" role="button" tabindex="0" aria-label="Abrir ${ui.escapeHtml(label)}">
        <strong>${ui.escapeHtml(value)}</strong>
        <span>${ui.escapeHtml(label)}</span>
      </article>
    `).join("");

    const recent = state.livros.slice(0, 8).map((book) => ({
      titulo: book.titulo,
      autor: book.autor,
      isbn: book.isbn,
      disponiveis: book.disponiveis
    }));

    elements.recentBooks.innerHTML = ui.renderTable([
      { label: "Título", render: (row) => `<strong>${ui.escapeHtml(row.titulo)}</strong><br><span>${ui.escapeHtml(row.autor)}</span>` },
      { label: "ISBN", render: (row) => ui.escapeHtml(row.isbn) },
      { label: "Disponíveis", render: (row) => `<span class="badge success">${ui.escapeHtml(row.disponiveis ?? 0)}</span>` }
    ], recent, "Ainda não existem livros carregados.");
  }

  function renderBooks(term = document.getElementById("bookSearch").value) {
    const rows = state.livros.filter((book) => ui.matchesSearch(book, term, ["titulo", "autor", "isbn", "categoria"]));

    elements.booksTable.innerHTML = ui.renderTable([
      { label: "Livro", render: (row) => `<strong>${ui.escapeHtml(row.titulo)}</strong><br><span>${ui.escapeHtml(row.autor)}</span>` },
      { label: "ISBN", render: (row) => ui.escapeHtml(row.isbn) },
      { label: "Ano", render: (row) => ui.escapeHtml(row.ano || "-") },
      { label: "Editora", render: (row) => ui.escapeHtml(row.editora || "-") },
      { label: "Categoria", render: (row) => ui.escapeHtml(row.categoria || "-") },
      { label: "Qtd.", render: (row) => ui.escapeHtml(row.quantidade ?? 0) },
      { label: "Disp.", render: (row) => `<span class="badge success">${ui.escapeHtml(row.disponiveis ?? 0)}</span>` },
      { label: "Ações", render: (row) => `
        <button class="table-action icon-action" data-edit-book="${ui.escapeHtml(row.id)}" aria-label="Editar livro" title="Editar livro"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
        <button class="table-action icon-action danger" data-delete-book="${ui.escapeHtml(row.id)}" aria-label="Eliminar livro" title="Eliminar livro"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      ` }
    ], rows, "Nenhum livro encontrado.");
  }

  function renderReaders(term = document.getElementById("readerSearch").value) {
    const rows = state.leitores.filter((reader) => ui.matchesSearch(reader, term, ["nome", "email", "nif", "telefone"]));

    elements.readersTable.innerHTML = ui.renderTable([
      { label: "Nome", render: (row) => `<strong>${ui.escapeHtml(row.nome)}</strong><br><span>${ui.escapeHtml(row.email)}</span>` },
      { label: "Telefone", render: (row) => ui.escapeHtml(row.telefone || "-") },
      { label: "NIF", render: (row) => ui.escapeHtml(row.nif || "-") },
      { label: "Morada", render: (row) => ui.escapeHtml(row.morada || "-") },
      { label: "Estado", render: (row) => `<span class="badge ${row.ativo ? "success" : "danger"}">${row.ativo ? "Ativo" : "Inativo"}</span>` },
      { label: "Ações", render: (row) => `
        <button class="table-action icon-action" data-edit-reader="${ui.escapeHtml(row.id)}" aria-label="Editar leitor" title="Editar leitor"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
        <button class="table-action icon-action danger" data-delete-reader="${ui.escapeHtml(row.id)}" aria-label="Eliminar leitor" title="Eliminar leitor"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      ` }
    ], rows, "Nenhum leitor encontrado.");
  }

  function renderUsers(term = document.getElementById("userSearch").value) {
    if (!isAdmin()) {
      elements.usersTable.innerHTML = ui.renderEmpty("Apenas administradores podem ver utilizadores.");
      return;
    }

    const rows = state.usuarios.filter((user) => ui.matchesSearch(user, term, ["nome", "username", "role"]));

    elements.usersTable.innerHTML = ui.renderTable([
      { label: "Utilizador", render: (row) => `<strong>${ui.escapeHtml(row.nome)}</strong><br><span>${ui.escapeHtml(row.username)}</span>` },
      { label: "Perfil", render: (row) => `<span class="badge">${ui.escapeHtml(row.role)}</span>` },
      { label: "Estado", render: (row) => `<span class="badge ${row.ativo ? "success" : "danger"}">${row.ativo ? "Ativo" : "Inativo"}</span>` },
      { label: "Criado em", render: (row) => ui.formatDate(row.createdAt) },
      { label: "Ações", render: (row) => `
        <button class="table-action" data-edit-user="${ui.escapeHtml(row.id)}">Editar</button>
        <button class="table-action danger" data-delete-user="${ui.escapeHtml(row.id)}">Eliminar</button>
      ` }
    ], rows, "Nenhum utilizador encontrado.");
  }

  function renderLoans(term = document.getElementById("loanSearch").value) {
    const rows = state.emprestimos.filter((loan) => {
      const flat = {
        leitor: loan.leitor ? loan.leitor.nome : loan.leitorId,
        livro: loan.livro ? loan.livro.titulo : loan.livroId,
        estado: loan.estado
      };
      return ui.matchesSearch(flat, term, ["leitor", "livro", "estado"]);
    });

    elements.loansTable.innerHTML = ui.renderTable([
      { label: "Leitor", render: (row) => ui.escapeHtml(row.leitor ? row.leitor.nome : `#${row.leitorId}`) },
      { label: "Livro", render: (row) => ui.escapeHtml(row.livro ? row.livro.titulo : `#${row.livroId}`) },
      { label: "Empréstimo", render: (row) => ui.formatDate(row.dataEmprestimo) },
      { label: "Prevista", render: (row) => ui.formatDate(row.dataPrevista) },
      { label: "Devolução", render: (row) => ui.formatDate(row.dataDevolucao) },
      { label: "Estado", render: (row) => `<span class="badge ${row.estado === "ATRASADO" ? "danger" : "success"}">${ui.escapeHtml(row.estado || "-")}</span>` },
      {
        label: "Ações",
        render: (row) => row.estado === "ATIVO"
          ? `<button class="table-action icon-action success" data-return-loan="${ui.escapeHtml(row.id)}" aria-label="Marcar devolução" title="Marcar devolução"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></button>`
          : "N/A"
      }
    ], rows, "Nenhum empréstimo encontrado.");
  }

  function bindFilters() {
    document.getElementById("bookSearch").addEventListener("input", (event) => renderBooks(event.target.value));
    document.getElementById("readerSearch").addEventListener("input", (event) => renderReaders(event.target.value));
    document.getElementById("userSearch").addEventListener("input", (event) => renderUsers(event.target.value));
    document.getElementById("loanSearch").addEventListener("input", (event) => renderLoans(event.target.value));

    document.body.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("button");
      if (!actionButton) return;
      const bookId = actionButton.dataset.editBook || actionButton.dataset.deleteBook;
      const userId = actionButton.dataset.editUser || actionButton.dataset.deleteUser;
      const loanId = actionButton.dataset.returnLoan;

      if (actionButton.dataset.editBook) {
        populateBookEditForm(bookId);
        openSheet("bookEditSheet");
      }

      if (actionButton.dataset.editReader) {
        populateReaderEditForm(actionButton.dataset.editReader);
        openSheet("readerEditSheet");
      }

      if (actionButton.dataset.deleteReader) {
        await runAction(() => api.deleteLeitor(actionButton.dataset.deleteReader), "Leitor eliminado.", "Não foi possível eliminar o leitor.");
      }

      if (actionButton.dataset.deleteBook) {
        await runAction(() => api.deleteLivro(bookId), "Livro eliminado.", "Não foi possível eliminar o livro.");
      }

      if (actionButton.dataset.editUser) {
        if (!isAdmin()) {
          ui.notify("Apenas administradores podem editar utilizadores.", "warning", 5200, "Acesso restrito");
          return;
        }
        populateUserEditForm(userId);
        openSheet("userEditSheet");
      }

      if (actionButton.dataset.deleteUser) {
        if (!isAdmin()) {
          ui.notify("Apenas administradores podem eliminar utilizadores.", "warning", 5200, "Acesso restrito");
          return;
        }
        await runAction(() => api.deleteUsuario(userId), "Utilizador eliminado.", "Não foi possível eliminar o utilizador.");
      }

      if (loanId) {
        await runAction(
          () => api.devolverEmprestimo(loanId),
          "Devolução registada com sucesso.",
          "Não foi possível registar a devolução."
        );
      }
    });
  }

  function populateBookEditForm(id) {
    const book = state.livros.find((item) => String(item.id) === String(id));
    const form = document.getElementById("bookEditForm");
    if (!book || !form) return;

    form.id.value = book.id ?? "";
    form.titulo.value = book.titulo ?? "";
    form.autor.value = book.autor ?? "";
    form.isbn.value = book.isbn ?? "";
    form.ano.value = book.ano ?? "";
    form.editora.value = book.editora ?? "";
    form.categoria.value = book.categoria ?? "";
  }

  function populateReaderEditForm(id) {
    const reader = state.leitores.find((item) => String(item.id) === String(id));
    const form = document.getElementById("readerEditForm");
    if (!reader || !form) return;

    form.id.value = reader.id ?? "";
    form.nome.value = reader.nome ?? "";
    form.email.value = reader.email ?? "";
    form.telefone.value = reader.telefone ?? "";
    form.nif.value = reader.nif ?? "";
    form.morada.value = reader.morada ?? "";
    form.ativo.checked = Boolean(reader.ativo);
  }

  function populateUserEditForm(id) {
    const user = state.usuarios.find((item) => String(item.id) === String(id));
    const form = document.getElementById("userEditForm");
    if (!user || !form) return;

    form.id.value = user.id ?? "";
    form.nome.value = user.nome ?? "";
    form.username.value = user.username ?? "";
    form.pin.value = "";
    form.role.value = user.role ?? "";
    form.ativo.checked = Boolean(user.ativo);
  }

  function bindForms() {
    bindSubmit("bookCreateForm", async (form) => {
      const data = ui.formData(form);
      data.quantidade = Number(data.quantidade || 1);
      const ok = await runAction(() => api.createLivro(data), "Livro registado com sucesso.", "Não foi possível registar o livro.");
      if (!ok) return;
      form.reset();
      form.quantidade.value = 1;
      closeSheet();
    });

    bindSubmit("bookEditForm", async (form) => {
      const data = ui.formData(form);
      const id = data.id;
      delete data.id;
      if (data.ano) data.ano = Number(data.ano);
      const ok = await runAction(() => api.updateLivro(id, data), "Livro atualizado.", "Não foi possível atualizar o livro.");
      if (!ok) return;
      form.reset();
      closeSheet();
    });

    bindSubmit("readerCreateForm", async (form) => {
      const data = ui.formData(form);
      data.ativo = true;
      const ok = await runAction(
        () => api.createLeitor(data),
        "Leitor registado com sucesso.",
        "Não foi possível registar o leitor. Confirme se o BI/NIF é válido."
      );
      if (!ok) return;
      form.reset();
      closeSheet();
    });

    bindSubmit("readerEditForm", async (form) => {
      const data = ui.formData(form);
      const id = data.id;
      delete data.id;
      data.ativo = form.ativo.checked;
      const ok = await runAction(() => api.updateLeitor(id, data), "Leitor atualizado.", "Não foi possível atualizar o leitor.");
      if (!ok) return;
      form.reset();
      closeSheet();
    });

    bindSubmit("userCreateForm", async (form) => {
      if (!isAdmin()) {
        ui.notify("Apenas administradores podem registar utilizadores.", "warning", 5200, "Acesso restrito");
        return;
      }
      const data = ui.formData(form);
      const ok = await runAction(() => api.createUsuario(data), "Utilizador criado.", "Não foi possível criar o utilizador.");
      if (!ok) return;
      form.reset();
      closeSheet();
    });

    bindSubmit("userEditForm", async (form) => {
      if (!isAdmin()) {
        ui.notify("Apenas administradores podem editar utilizadores.", "warning", 5200, "Acesso restrito");
        return;
      }
      const data = ui.formData(form);
      const id = data.id;
      delete data.id;
      if (!data.role) delete data.role;
      if (!data.pin) delete data.pin;
      const ok = await runAction(() => api.updateUsuario(id, data), "Utilizador atualizado.", "Não foi possível atualizar o utilizador.");
      if (!ok) return;
      form.reset();
      closeSheet();
    });

    bindSubmit("loanCreateForm", async (form) => {
      const data = ui.formData(form);
      data.leitorId = String(data.leitorId);
      data.livroId = String(data.livroId);
      const ok = await runAction(
        () => api.createEmprestimo(data),
        "Empréstimo registado com sucesso.",
        "Não foi possível registar o empréstimo."
      );
      if (!ok) return;
      form.reset();
      closeSheet();
    });
  }

  function populateLoanSelects() {
    if (elements.loanReaderSelect) {
      const readerOptions = state.leitores
        .map((reader) => `<option value="${ui.escapeHtml(reader.id)}">${ui.escapeHtml(reader.nome)}</option>`)
        .join("");
      elements.loanReaderSelect.innerHTML = `<option value="">Selecione um leitor</option>${readerOptions}`;
    }

    if (elements.loanBookSelect) {
      const bookOptions = state.livros
        .map((book) => `<option value="${ui.escapeHtml(book.id)}">${ui.escapeHtml(book.titulo)}</option>`)
        .join("");
      elements.loanBookSelect.innerHTML = `<option value="">Selecione um livro</option>${bookOptions}`;
    }
  }

  function bindSubmit(formId, handler) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.style.opacity = "0.64";

      try {
        await handler(form);
      } finally {
        submitButton.disabled = false;
        submitButton.style.opacity = "";
      }
    });
  }

  async function runAction(action, successMessage, errorMessage) {
    try {
      await action();
      ui.notify(successMessage, "success", 4200, "Sucesso");
      await loadAllData();
      return true;
    } catch (error) {
      if (error.status === 401) {
        handleUnauthorized();
        return false;
      }
      ui.notify(resolveErrorMessage(error, errorMessage), "error", 9000, "Erro");
      return false;
    }
  }

  async function runAuthAction(action, successMessage, errorMessage) {
    try {
      await action();
      ui.notify(successMessage, "success", 4200, "Sucesso");
      return true;
    } catch (error) {
      ui.notify(resolveErrorMessage(error, errorMessage), "error", 9000, "Erro");
      return false;
    }
  }

  function resolveErrorMessage(error, fallback) {
    if (!error) return fallback;
    if (error.status === 401) return MESSAGES.auth.expired;
    if (error.status === 403) return "Não tem permissões para efetuar esta ação.";
    if (error.status === 404) return "O registo pedido não foi encontrado.";
    if (error.status === 409) return "Já existe um registo com os mesmos dados.";
    if (error.status >= 500) return "O servidor encontrou um erro. Tente novamente.";
    if (error.message && error.message.includes("conectar")) {      return "Não foi possível ligar ao servidor. Verifique se o serviço está em execução.";
    }
    return error.message ? `${fallback} ${error.message}` : fallback;
  }
})();


