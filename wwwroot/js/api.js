const Api = {
  async requisitar(caminho, { metodo = "GET", corpo, formData } = {}) {
    const headers = { ...AuthService.montarCabecalhos() };
    let body;
    if (formData) {
      body = formData;
    } else if (corpo !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(corpo);
    }

    let resposta;
    try {
      resposta = await fetch(`${CONFIG.API_BASE_URL}${caminho}`, { method: metodo, headers, body });
    } catch {
      throw new Error("Não foi possível conectar ao servidor.");
    }

    if (resposta.status === 401) {
      AuthService.limparSessao();
      window.location.replace("index.html");
      throw new Error("Sessão expirada. Entre novamente.");
    }
    if (!resposta.ok) throw new Error(await Api.mensagemErro(resposta));
    if (resposta.status === 204) return null;
    return resposta.json();
  },

  async mensagemErro(resposta) {
    try {
      const d = await resposta.json();
      if (d.erro) return d.erro;
      if (d.errors) return Object.values(d.errors).flat().join(" ");
      if (d.title) return d.title;
    } catch {  }
    return "Não foi possível concluir a operação.";
  },

  get: (c) => Api.requisitar(c),
  post: (c, corpo) => Api.requisitar(c, { metodo: "POST", corpo }),
  put: (c, corpo) => Api.requisitar(c, { metodo: "PUT", corpo }),
  del: (c) => Api.requisitar(c, { metodo: "DELETE" }),
  enviar: (c, formData) => Api.requisitar(c, { metodo: "POST", formData }),
};

const Util = {
  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  valor(v) {
    if (!v) return "A combinar";
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },
  data(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
  },
  local(e) {
    return e && (e.cidade || e.estado) ? [e.cidade, e.estado].filter(Boolean).join(" - ") : "Local não informado";
  },
  iniciais(nome) {
    const p = String(nome || "").trim().split(/\s+/);
    return (((p[0] || "")[0] || "") + ((p.length > 1 ? p[p.length - 1] : "")[0] || "")).toUpperCase();
  },
  ROTULO_STATUS: { Aberta: "Aberta", EmAndamento: "Em andamento", Concluida: "Concluída", Cancelada: "Cancelada", Pendente: "Pendente", Aceita: "Aceita", Recusada: "Recusada" },
};

const Categorias = {
  async carregar() {
    try {
      const lista = await fetch(`${CONFIG.API_BASE_URL}/Habilidades`).then((r) => (r.ok ? r.json() : []));
      if (Array.isArray(lista) && lista.length) {
        HABILIDADES.splice(0, HABILIDADES.length, ...lista.map((h) => ({ id: h.id, nome: h.nome })));
      }
    } catch {  }
  },

  async resolver(texto) {
    const nome = String(texto || "").trim();
    const ex = HABILIDADES.find((h) => h.nome.toLowerCase() === nome.toLowerCase());
    if (ex) return ex.id;
    const criada = await Api.post("/Habilidades", { nome });
    if (!HABILIDADES.some((h) => h.id === criada.id)) HABILIDADES.push({ id: criada.id, nome: criada.nome });
    return criada.id;
  },
};
document.addEventListener("DOMContentLoaded", () => Categorias.carregar());

Util.rotuloCandidatura = (status, statusVaga) => {
  if (status === "Aceita") return statusVaga === "Concluida" ? "Finalizada" : "Aceito";
  if (status === "Recusada") return "Recusado";
  return "Pendente";
};
Util.classeCandidatura = (status, statusVaga) =>
  status === "Aceita" && statusVaga === "Concluida" ? "concluida" : String(status).toLowerCase();
