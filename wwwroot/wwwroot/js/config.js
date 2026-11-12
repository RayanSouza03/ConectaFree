const CONFIG = {
  // Front servido pelo proprio ASP.NET: mesma origem da API.
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
  GOOGLE_ENDPOINT: "/Usuarios/google",
  ESQUECI_SENHA_ENDPOINT: "/Usuarios/esqueci-senha",
  REDEFINIR_SENHA_ENDPOINT: "/Usuarios/redefinir-senha",
  ACEITAR_TERMOS_ENDPOINT: "/Usuarios/aceitar-termos",
  CNPJ_ENDPOINT: "/Cnpj",
  PUBLICO_CONFIG_ENDPOINT: "/Config",
  ESTADOS_ENDPOINT: "/Localidades/estados",
  CIDADES_ENDPOINT: "/Localidades/cidades",
};

// Ids iguais ao seed de Habilidades no ConectaFreeDbContext
const HABILIDADES = ["Design gráfico","Ilustração","Social media","Programação","Babá","Garçom","Marketing digital","Edição de vídeo","Fotografia","UI/UX Design","Desenvolvimento Web","Desenvolvimento Mobile","Consultoria","Contabilidade","Advocacia","Arquitetura","Engenharia","Professor particular","Cuidador de idosos","Pintor","Eletricista","Encanador","Cuidador de pet","Bartender","Jardineiro"]
  .map((nome, i) => ({ id: i + 1, nome }));
