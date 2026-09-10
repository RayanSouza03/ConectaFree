/**
 * Configurações da aplicação.
 * Como o front agora é servido pela própria API (wwwroot),
 * usamos caminho relativo "/api" — não precisa mais de localhost:porta fixo.
 */
const CONFIG = {
  API_BASE_URL: "/api",
  LOGIN_ENDPOINT: "/usuarios/login",
};
