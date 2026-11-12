/** Camada de acesso a API de perfil (usa Api de api.js). */
const PerfilService = {
  buscarPerfil() {
    return Api.get(CONFIG.PERFIL_ENDPOINT);
  },

  buscarPublico(id) {
    return Api.get(`${CONFIG.USUARIOS_ENDPOINT}/${encodeURIComponent(id)}`);
  },

  atualizarPerfil(dadosPerfil) {
    return Api.put(CONFIG.PERFIL_ENDPOINT, dadosPerfil);
  },

  enviarFoto(arquivo) {
    const formData = new FormData();
    formData.append("foto", arquivo);
    return Api.enviar(CONFIG.PERFIL_FOTO_ENDPOINT, formData);
  },

  async buscarEnderecoPorCep(cep) {
    const d = await Api.get(`/Cep/${encodeURIComponent(cep)}`);
    return {
      logradouro: d.logradouro || "",
      bairro: d.bairro || "",
      cidade: d.cidade || "",
      estado: d.estado || "",
    };
  },
};
