/* Estados e cidades oficiais (IBGE, via /api/Localidades) com autocomplete sem acento/maiúscula.
   Depende de config.js e autocomplete.js. Se a API do IBGE cair, a UF usa a lista fixa e a cidade vira texto livre. */
const Localidades = {
  UFS_FALLBACK: [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"],
    ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"],
    ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
    ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
    ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
    ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
  ].map(([sigla, nome]) => ({ sigla, nome })),

  _estados: null,
  _cidades: {}, // "PR" -> [{nome, uf}], "*" -> todas

  norm(t) {
    return Autocomplete.norm(t);
  },

  async _buscar(caminho) {
    const r = await fetch(`${CONFIG.API_BASE_URL}${caminho}`);
    if (!r.ok) throw new Error("IBGE indisponível");
    return r.json();
  },

  async estados() {
    if (!this._estados) {
      try {
        const lista = await this._buscar(CONFIG.ESTADOS_ENDPOINT);
        this._estados = Array.isArray(lista) && lista.length ? lista : this.UFS_FALLBACK;
      } catch {
        return this.UFS_FALLBACK; // não guarda: tenta de novo na próxima
      }
    }
    return this._estados;
  },

  // uf vazia = todas as cidades do país
  async cidades(uf) {
    const chave = uf || "*";
    if (!this._cidades[chave]) {
      try {
        const q = uf ? `?uf=${encodeURIComponent(uf)}` : "";
        const lista = await this._buscar(`${CONFIG.CIDADES_ENDPOINT}${q}`);
        this._cidades[chave] = Array.isArray(lista) ? lista : [];
      } catch {
        return []; // sem IBGE: o campo continua aceitando texto livre
      }
    }
    return this._cidades[chave];
  },

  // "Sigla" válida (ex.: "pr" -> "PR") ou "" se o texto não for uma UF
  ufValida(texto) {
    const t = String(texto || "").trim().toUpperCase();
    return this.UFS_FALLBACK.some((e) => e.sigla === t) ? t : "";
  },

  // Transforma o que foi digitado ("sao paulo") no nome oficial ("São Paulo").
  // Só resolve quando há uma única cidade com esse nome (dentro da UF, se informada).
  async resolverCidade(texto, uf) {
    const n = this.norm(texto);
    if (!n) return null;
    const achadas = (await this.cidades(this.ufValida(uf))).filter((c) => this.norm(c.nome) === n);
    return achadas.length === 1 ? achadas[0] : null;
  },

  /* Campo de UF (input texto): aceita sigla ou nome do estado ("pr", "parana") e grava a sigla */
  vincularUf(campoUf, { aoEscolher } = {}) {
    let estados = this.UFS_FALLBACK;
    this.estados().then((l) => { estados = l; });

    Autocomplete.criar(campoUf, {
      itens: () => estados.map((e) => ({ nome: e.nome, sigla: e.sigla, dica: e.sigla })),
      casar: (q, it) => {
        const n = this.norm(q);
        return !n || this.norm(it.sigla).startsWith(n) || this.norm(it.nome).includes(n);
      },
      valor: (it) => it.sigla,
      aoEscolher: (it) => { if (aoEscolher) aoEscolher(it.sigla); },
    });

    // Ao sair do campo, "parana" vira "PR"
    campoUf.addEventListener("blur", () => {
      const n = this.norm(campoUf.value);
      if (!n) return;
      const ex = estados.find((e) => this.norm(e.sigla) === n || this.norm(e.nome) === n);
      if (ex) campoUf.value = ex.sigla;
    });
  },

  /* Campo de cidade com sugestões filtradas pela UF escolhida (ou de todo o país se a UF estiver vazia).
     campoUf pode ser <input> ou <select>. Escolher uma cidade preenche a UF quando ela está vazia. */
  vincular({ cidade: campoCidade, uf: campoUf, aoMudar }) {
    let lista = [];
    let ufCarregada = null;

    const ufAtual = () => this.ufValida(campoUf && campoUf.value);

    const carregar = async () => {
      const uf = ufAtual();
      if (uf === ufCarregada) return;
      ufCarregada = uf;
      lista = await this.cidades(uf);
      if (!lista.length) ufCarregada = null; // IBGE falhou: tenta de novo no próximo foco
      if (document.activeElement === campoCidade) ac.atualizar();
    };

    const definirUf = (sigla) => {
      if (!campoUf || !sigla || ufAtual() === sigla) return;
      campoUf.value = sigla;
      campoUf.dispatchEvent(new Event("change", { bubbles: true }));
      carregar();
    };

    const ac = Autocomplete.criar(campoCidade, {
      itens: () => lista.map((c) => ({ nome: c.nome, uf: c.uf, dica: c.uf })),
      aoEscolher: (it) => { definirUf(it.uf); if (aoMudar) aoMudar(); },
    });

    campoCidade.addEventListener("focus", carregar);

    // Ao sair do campo: "sao paulo" -> "São Paulo" (e preenche a UF se estava vazia)
    campoCidade.addEventListener("blur", async () => {
      const texto = campoCidade.value.trim();
      if (!texto) return;
      await carregar();
      const c = await this.resolverCidade(texto, campoUf && campoUf.value);
      if (!c) return;
      campoCidade.value = c.nome;
      definirUf(c.uf);
    });

    if (campoUf) {
      campoUf.addEventListener("change", carregar);
      campoUf.addEventListener("input", carregar);
    }

    return { atualizar: carregar };
  },
};
