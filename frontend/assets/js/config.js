window.BIBLIOTECA_CONFIG = {
  // Dev (Live Server porta 5500) → aponta directo ao backend
  // Docker / produção → usa o proxy nginx em /api
  API_BASE_URL: window.location.port === "5500" ? "http://localhost:3000" : "/api"
};
