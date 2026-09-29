const CONFIG = {
  API_BASE_URL: "/api",
  LOGIN_ENDPOINT: "/Usuarios/login",
  CADASTRO_ENDPOINT: "/Usuarios/cadastro",
  PERFIL_ENDPOINT: "/Usuarios/perfil",
  PERFIL_FOTO_ENDPOINT: "/Usuarios/perfil/foto",
  USUARIOS_ENDPOINT: "/Usuarios",
  FREELANCERS_ENDPOINT: "/Usuarios/filtrar-freelancers",
  VAGAS_ENDPOINT: "/Anuncio/filtrar",
  ANUNCIO_ENDPOINT: "/Anuncio",
  PORTFOLIO_ENDPOINT: "/Portfolio",
  CEP_API_URL: "https://viacep.com.br/ws",
};

const HABILIDADES = ["Design gráfico","Ilustração","Social media","Programação","Babá","Garçom","Marketing digital","Edição de vídeo","Fotografia","UI/UX Design","Desenvolvimento Web","Desenvolvimento Mobile","Consultoria","Contabilidade","Advocacia","Arquitetura","Engenharia","Professor particular","Cuidador de idosos","Pintor","Eletricista","Encanador","Cuidador de pet","Bartender","Jardineiro"]
  .map((nome, i) => ({ id: i + 1, nome }));
