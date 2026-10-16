/* Campo de texto com sugestões enquanto digita (sem acento/maiúscula, com radical e sinônimos). */
const Autocomplete = {
  SINONIMOS: {
    programador: ["Programação", "Desenvolvimento Web", "Desenvolvimento Mobile"],
    desenvolvedor: ["Programação", "Desenvolvimento Web", "Desenvolvimento Mobile"],
    dev: ["Programação", "Desenvolvimento Web", "Desenvolvimento Mobile"],
    site: ["Desenvolvimento Web", "UI/UX Design"],
    app: ["Desenvolvimento Mobile", "UI/UX Design"],
    designer: ["Design gráfico", "UI/UX Design", "Ilustração"],
    logo: ["Design gráfico"],
    video: ["Edição de vídeo"],
    foto: ["Fotografia"],
    fotografo: ["Fotografia"],
    limpeza: ["Cuidador de idosos"],
    obra: ["Pintor", "Eletricista", "Encanador", "Engenharia", "Arquitetura"],
    aula: ["Professor particular"],
    advogado: ["Advocacia"],
    contador: ["Contabilidade"],
    bar: ["Bartender", "Garçom"],
    pet: ["Cuidador de pet"],
    crianca: ["Babá"],
  },

  norm(t) {
    return String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  },

  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  // A consulta combina com o texto?
  combina(consulta, texto) {
    const q = this.norm(consulta);
    if (!q) return true;
    const t = this.norm(texto);
    if (t.includes(q)) return true;
    for (const w of t.split(/[\s\/\-]+/)) {
      if (w.length >= 5 && q.length >= 5 && (q.startsWith(w.slice(0, 5)) || w.startsWith(q.slice(0, 5)))) return true;
    }
    for (const chave of Object.keys(this.SINONIMOS)) {
      if (q.length >= 3 && (chave.startsWith(q) || q.startsWith(chave)) &&
          this.SINONIMOS[chave].some((n) => this.norm(n) === t)) return true;
    }
    return false;
  },

  criar(input, { itens, aoEscolher, max = 8, ancora = null, permitirCriar = false }) {
    const wrap = ancora || input.parentElement;
    if (getComputedStyle(wrap).position === "static") wrap.classList.add("ac-wrap");
    const ul = document.createElement("ul");
    ul.className = "ac-lista";
    ul.hidden = true;
    ul.setAttribute("role", "listbox");
    wrap.appendChild(ul);
    input.setAttribute("autocomplete", "off");

    let lista = [];
    let ativo = -1;

    const marcar = (nome, q) => {
      const n = this.norm(nome), qn = this.norm(q), i = qn ? n.indexOf(qn) : -1;
      if (i < 0) return this.esc(nome);
      return this.esc(nome.slice(0, i)) + "<mark>" + this.esc(nome.slice(i, i + qn.length)) + "</mark>" + this.esc(nome.slice(i + qn.length));
    };

    const render = () => {
      const q = input.value;
      const base = typeof itens === "function" ? itens() : itens;
      const qn = this.norm(q);
      lista = base
        .filter((it) => this.combina(q, it.nome))
        .sort((a, b) => (this.norm(b.nome).startsWith(qn) ? 1 : 0) - (this.norm(a.nome).startsWith(qn) ? 1 : 0))
        .slice(0, max);
      const digitado = q.trim();
      if (permitirCriar && digitado.length >= 2 && !base.some((it) => this.norm(it.nome) === qn)) {
        lista.push({ nome: digitado, criar: true });
      }
      ativo = -1;
      ul.innerHTML = lista
        .map((it, i) => it.criar
          ? `<li role="option" class="criar" data-i="${i}">Usar nova categoria “${this.esc(it.nome)}”<small>criar</small></li>`
          : `<li role="option" data-i="${i}">${marcar(it.nome, q)}${it.dica ? `<small>${this.esc(it.dica)}</small>` : ""}</li>`)
        .join("");
      ul.hidden = lista.length === 0;
    };

    const escolher = (it) => {
      input.value = it.nome;
      ul.hidden = true;
      if (aoEscolher) aoEscolher(it);
    };

    const realcar = () => {
      [...ul.children].forEach((li, i) => li.classList.toggle("ativo", i === ativo));
      if (ativo >= 0) ul.children[ativo].scrollIntoView({ block: "nearest" });
    };

    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("blur", () => setTimeout(() => { ul.hidden = true; }, 130));
    input.addEventListener("keydown", (e) => {
      if (ul.hidden && (e.key === "ArrowDown")) render();
      if (e.key === "ArrowDown") { ativo = Math.min(ativo + 1, lista.length - 1); realcar(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { ativo = Math.max(ativo - 1, 0); realcar(); e.preventDefault(); }
      else if (e.key === "Enter" && !ul.hidden && ativo >= 0) { e.preventDefault(); escolher(lista[ativo]); }
      else if (e.key === "Escape") { ul.hidden = true; }
    });
    ul.addEventListener("mousedown", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      e.preventDefault();
      escolher(lista[Number(li.dataset.i)]);
    });

    return { atualizar: render, fechar: () => { ul.hidden = true; } };
  },
};
