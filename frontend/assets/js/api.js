(function () {
  const config = window.BIBLIOTECA_CONFIG || {};
  const baseUrl = (config.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const sessionKey = "biblioteca.session";

  function getSession() {
    try {
      const raw = window.localStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setSession(session) {
    window.localStorage.setItem(sessionKey, JSON.stringify(session));
  }

  function setToken(token) {
    const session = getSession() || {};
    setSession({ ...session, token });
  }

  function clearSession() {
    window.localStorage.removeItem(sessionKey);
  }

  function getToken() {
    const session = getSession();
    return session && session.token ? session.token : "";
  }

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const token = options.token !== undefined ? options.token : getToken();
    const hasBody = options.body !== undefined;
    const init = {
      method: options.method || "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    };

    if (hasBody) {
      init.body = JSON.stringify(options.body);
    }

    let response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      throw new Error(`Não foi possível conectar à API em ${baseUrl}. Verifique se o backend está rodando e se CORS permite esta origem.`);
    }

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = text;
      }
    }

    if (!response.ok) {
      const message = payload && payload.message ? payload.message : `Erro HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  window.BibliotecaApi = {
    baseUrl,
    getSession,
    setSession,
    setToken,
    clearSession,
    login: async (credentials) => {
      const session = await request("/auth/login", { method: "POST", body: credentials, token: "" });
      setSession(session);
      return session;
    },
    getLivros: () => request("/livros"),
    getLivro: (id) => request(`/livros/${id}`),
    getLivroByIsbn: (isbn) => request(`/livros/isbn/${encodeURIComponent(isbn)}`),
    createLivro: (data) => request("/livros", { method: "POST", body: data }),
    updateLivro: (id, data) => request(`/livros/${id}`, { method: "PUT", body: data }),
    deleteLivro: (id) => request(`/livros/${id}`, { method: "DELETE" }),

    getLeitores: () => request("/leitores"),
    getLeitor: (id) => request(`/leitores/${id}`),
    createLeitor: (data) => request("/leitores", { method: "POST", body: data }),
    updateLeitor: (id, data) => request(`/leitores/${id}`, { method: "PUT", body: data }),
    deleteLeitor: (id) => request(`/leitores/${id}`, { method: "DELETE" }),

    getUsuarios: () => request("/usuarios"),
    getUsuario: (id) => request(`/usuarios/${id}`),
    createUsuario: (data) => request("/usuarios", { method: "POST", body: data }),
    updateUsuario: (id, data) => request(`/usuarios/${id}`, { method: "PUT", body: data }),
    deleteUsuario: (id) => request(`/usuarios/${id}`, { method: "DELETE" }),

    getEmprestimos: () => request("/emprestimos"),
    createEmprestimo: (data) => request("/emprestimos", { method: "POST", body: data }),
    devolverEmprestimo: (id) => request(`/emprestimos/${id}/devolver`, { method: "PATCH" })
  };
})();
