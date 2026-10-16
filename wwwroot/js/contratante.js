document.addEventListener("DOMContentLoaded", async () => {
  const nome = localStorage.getItem("usuarioNome");
  if (nome) document.getElementById("nomeContratante").textContent = nome.split(" ")[0];

  const selHab = document.getElementById("filtroHabilidade");
  const lista = document.getElementById("listaFreelancers");
  const status = document.getElementById("statusBusca");

  let habilidadeId = null;
  Autocomplete.criar(selHab, {
    itens: () => HABILIDADES.map((h) => ({ id: h.id, nome: h.nome })),
    aoEscolher: (it) => { habilidadeId = it.id; buscar(); },
  });
  selHab.addEventListener("input", () => {
    const ex = HABILIDADES.find((h) => Autocomplete.norm(h.nome) === Autocomplete.norm(selHab.value));
    habilidadeId = ex ? ex.id : null;
  });
  const esc = Util.esc;

  async function buscar() {
    const params = new URLSearchParams();
    if (habilidadeId) params.set("habilidadeId", habilidadeId);
    const cidade = document.getElementById("filtroCidade").value.trim();
    const uf = document.getElementById("filtroEstado").value.trim().toUpperCase();
    if (cidade) params.set("cidade", cidade);
    if (uf) params.set("estado", uf);

    status.textContent = "Buscando...";
    lista.innerHTML = "";
    try {
      const dados = await Api.get(`${CONFIG.FREELANCERS_ENDPOINT}?${params}`);
      status.textContent = dados.length ? `${dados.length} freelancer(s) encontrado(s)` : "Nenhum freelancer encontrado.";
      lista.innerHTML = dados.map((u) => `
        <article class="card-c">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            ${u.fotoUrl ? `<img class="avatar-foto" src="${esc(u.fotoUrl)}" alt="">` : `<div class="avatar-inicial">${esc(Util.iniciais(u.nome))}</div>`}
            <h3>${esc(u.nome)}</h3>
          </div>
          <p class="local">${u.endereco ? esc(u.endereco.cidade) + " - " + esc(u.endereco.estado) : "Local não informado"}</p>
          <p class="bio">${esc(u.bio || "")}</p>
          <div>${(u.habilidades || []).map((h) => `<span class="tag-c">${esc(h.nome)}</span>`).join("")}${u.outraHabilidade ? `<span class="tag-c">${esc(u.outraHabilidade)}</span>` : ""}</div>
          <p style="margin-top:12px"><a class="tag-c" style="text-decoration:none" href="visualizar-perfil.html?id=${u.id}">Ver perfil</a></p>
        </article>`).join("");
    } catch (e) {
      status.textContent = e.message;
    }
  }

  document.getElementById("btnBuscar").addEventListener("click", buscar);
  buscar();
});
