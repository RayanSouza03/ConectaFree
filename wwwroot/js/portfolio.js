const $ = (id) => document.getElementById(id);
const ICONE_FOTO = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5.5-5.5L7 19"/></svg>';
const ICONE_LIXO = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';

function idDoToken(){
  try{
    const carga = JSON.parse(atob(AuthService.obterToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return carga['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || carga.nameid || carga.sub;
  }catch{ return null; }
}

const lista = $('listaExperiencias');
if(lista){
  const outroId = new URLSearchParams(location.search).get('usuario');
  const somenteLeitura = !!outroId;
  let itensCache = [];
  if(somenteLeitura){
    $('btnNovaExperiencia').hidden = true;
    $('btnNovaExperiencia').style.display = 'none';
    Api.get(CONFIG.USUARIOS_ENDPOINT + '/' + encodeURIComponent(outroId))
      .then(u => { document.querySelector('.cabecalho-pagina h1').textContent = 'Portfólio de ' + u.nome; })
      .catch(() => {});
  }

  async function renderizar(){
    const vazio = $('estadoVazio');
    try{
      const itens = await Api.get(CONFIG.PORTFOLIO_ENDPOINT + '/' + (outroId || idDoToken()));
      itensCache = itens;
      lista.innerHTML = '';
      vazio.hidden = itens.length > 0;
      itens.forEach(it => {
        const li = document.createElement('li');
        li.className = 'card-experiencia item-clicavel';
        li.dataset.id = it.id;
        li.innerHTML =
          '<div class="miniatura-experiencia">' + (it.fotoUrl && !PortfolioUI.ehPdf(it.fotoUrl) ? '<img src="' + Util.esc(it.fotoUrl) + '" alt="">' : ICONE_FOTO) + '</div>' +
          '<div class="corpo-experiencia">' +
            '<p class="titulo-experiencia">' + Util.esc(it.titulo || 'Sem título') + '</p>' +
            '<p class="meta-experiencia">' + (it.tipo === 'Vaga' ? 'Vaga concluída' : 'Trabalho') + ' · ' + Util.data(it.dataCriacao) + '</p>' +
            '<p class="descricao-experiencia">' + Util.esc(it.descricao || 'Sem descrição adicionada.') + '</p>' +
          '</div>' +
          (somenteLeitura ? '' : '<div class="acoes-experiencia"><button type="button" class="botao-remover" data-id="' + it.id + '">' + ICONE_LIXO + ' Remover</button></div>');
        lista.appendChild(li);
      });
    }catch(e){
      vazio.hidden = false;
      vazio.querySelector('.titulo-vazio').textContent = 'Não foi possível carregar o portfólio';
      vazio.querySelector('.texto-vazio').textContent = e.message;
    }
  }

  lista.addEventListener('click', async (e) => {
    const b = e.target.closest('.botao-remover');
    if(!b){
      const card = e.target.closest('.card-experiencia');
      const item = card && itensCache.find(x => String(x.id) === card.dataset.id);
      if(item) PortfolioUI.abrir(item);
      return;
    }
    if(!confirm('Remover este item do portfólio?')) return;
    try{ await Api.del(CONFIG.PORTFOLIO_ENDPOINT + '/' + b.dataset.id); renderizar(); }
    catch(erro){ alert(erro.message); }
  });

  renderizar();
}

const formulario = $('formExperiencia');
if(formulario){
  const tipo = $('tipo');
  const selVaga = $('anuncioId');

  async function carregarVagasConcluidas(){
    try{
      const vagas = await Api.get(CONFIG.ANUNCIO_ENDPOINT + '/concluidas/minhas');
      vagas.forEach(v => selVaga.insertAdjacentHTML('beforeend', '<option value="' + v.id + '">' + Util.esc(v.titulo) + '</option>'));
      $('avisoVagas').textContent = vagas.length ? '' : 'Você ainda não tem vagas concluídas. Elas aparecem aqui quando o contratante aceita sua candidatura e marca a vaga como concluída.';
    }catch(e){ $('avisoVagas').textContent = e.message; }
  }

  function alternar(){
    const ehVaga = tipo.value === 'Vaga';
    $('blocoVaga').hidden = !ehVaga;
    $('blocoFoto').hidden = ehVaga;
    $('rotuloTitulo').textContent = ehVaga ? 'Título (opcional, usa o da vaga)' : 'Título';
  }
  tipo.addEventListener('change', alternar);
  alternar();
  carregarVagasConcluidas();

  const foto = $('foto');
  const dz = $('dropzoneFoto');
  foto.addEventListener('change', () => {
    dz.querySelectorAll('img').forEach(i => i.remove());
    const arq = foto.files[0];
    if(!arq) { dz.classList.remove('tem-imagem'); return; }
    if(arq.type === 'application/pdf'){ dz.classList.remove('tem-imagem'); dz.querySelector('.rotulo-dropzone').textContent = 'Arquivo: ' + arq.name; return; }
    const img = document.createElement('img');
    img.alt = '';
    img.src = URL.createObjectURL(arq);
    dz.insertBefore(img, dz.firstChild);
    dz.classList.add('tem-imagem');
  });

  formulario.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    $('erroTitulo').classList.remove('visivel');
    $('erroFoto').classList.remove('visivel');
    $('erroGeral').textContent = '';

    const ehVaga = tipo.value === 'Vaga';
    const titulo = $('titulo').value.trim();
    if(!ehVaga && !titulo){ $('erroTitulo').classList.add('visivel'); return; }
    if(!ehVaga && !foto.files[0]){ $('erroFoto').classList.add('visivel'); return; }
    if(ehVaga && !selVaga.value){ $('erroGeral').textContent = 'Selecione uma vaga concluída.'; return; }

    const fd = new FormData();
    fd.append('Tipo', tipo.value);
    if(titulo) fd.append('Titulo', titulo);
    if($('descricao').value.trim()) fd.append('Descricao', $('descricao').value.trim());
    if(ehVaga) fd.append('AnuncioId', selVaga.value);
    else fd.append('Foto', foto.files[0]);

    const botao = formulario.querySelector('.botao-primario');
    botao.disabled = true; botao.textContent = 'Salvando...';
    try{
      await Api.enviar(CONFIG.PORTFOLIO_ENDPOINT, fd);
      window.location.href = 'portfolio.html';
    }catch(e){
      $('erroGeral').textContent = e.message;
      botao.disabled = false; botao.textContent = 'Salvar no portfólio';
    }
  });
}
