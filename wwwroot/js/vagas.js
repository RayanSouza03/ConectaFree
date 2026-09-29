const ICONES = {
  pin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  cash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
  users: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.5 2.6 3.5 5.5"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
};

const ICONE_WHATS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#fff"/></svg>';

function linkWhatsApp(telefone, nome, tituloVaga){
  let n = String(telefone || '').replace(/\D/g, '');
  if(n.length < 10) return null;
  if(n.length <= 11) n = '55' + n;
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
  const texto = 'Olá ' + primeiro + '! Vi sua candidatura para a vaga "' + tituloVaga + '" no ConectaFree e gostaria de conversar.';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
}

const $ = (id) => document.getElementById(id);
const esc = Util.esc;
const fmtData = Util.data;
const fmtValor = Util.valor;
const rotulo = (st) => Util.ROTULO_STATUS[st] || st;
const classeStatus = (st) => String(st).toLowerCase();

function lerValor(texto){
  const limpo = String(texto).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  if(!limpo) return 0;
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}

const form = $('formVaga');
const telaLista = $('telaLista');
const telaDetalhe = $('telaDetalhe');
const tituloPagina = $('tituloPagina');
const subtituloPagina = $('subtituloPagina');
const botaoTopo = $('botaoTopo');
const textoBotaoTopo = $('textoBotaoTopo');
const contadorVagas = $('contadorVagas');
const linkVoltar = $('linkVoltar');
const textoVoltar = $('textoVoltar');

let categoriaId = null;
Autocomplete.criar($('categoriaVaga'), {
  permitirCriar: true,
  itens: () => HABILIDADES.map(h => ({ id: h.id, nome: h.nome })),
  aoEscolher: (it) => { categoriaId = it.criar ? null : it.id; }
});
$('categoriaVaga').addEventListener('input', () => {
  const ex = HABILIDADES.find(h => Autocomplete.norm(h.nome) === Autocomplete.norm($('categoriaVaga').value));
  categoriaId = ex ? ex.id : null;
});

let vagas = [];
let editandoId = null;
let tela = 'form';

function erroGeral(msg){ $('erroGeralVaga').textContent = msg || ''; }

async function recarregarVagas(){
  vagas = await Api.get(CONFIG.ANUNCIO_ENDPOINT + '/minhas');
  contadorVagas.textContent = vagas.length;
}

function mostrar(nova){
  tela = nova;
  form.hidden = nova !== 'form';
  telaLista.hidden = nova !== 'lista';
  telaDetalhe.hidden = nova !== 'detalhe';
  window.scrollTo({ top: 0 });
}

function irParaForm(id){
  editandoId = id || null;
  limparErros();
  erroGeral('');
  const vaga = id ? vagas.find(v => v.id === id) : null;
  $('nomeVaga').value = vaga ? vaga.titulo : '';
  $('categoriaVaga').value = vaga ? vaga.habilidade.nome : '';
  categoriaId = vaga ? vaga.habilidade.id : null;
  $('statusVaga').value = vaga ? vaga.status : 'Aberta';
  $('urgenteVaga').checked = vaga ? vaga.urgente : false;
  $('valorVaga').value = vaga && vaga.valorProposto ? fmtValor(vaga.valorProposto) : '';
  $('descricaoVaga').value = vaga ? vaga.descricao : '';
  tituloPagina.textContent = vaga ? 'Editar vaga' : 'Postar vaga';
  subtituloPagina.textContent = vaga
    ? 'Atualize as informações da vaga e salve as alterações.'
    : 'Preencha as informações abaixo para divulgar uma nova vaga aos freelancers.';
  $('botaoSalvar').textContent = vaga ? 'Salvar alterações' : 'Publicar vaga';
  $('botaoCancelar').textContent = vaga ? 'Cancelar' : 'Limpar';
  $('botaoExcluir').hidden = !vaga;
  textoBotaoTopo.textContent = 'Suas Vagas';
  botaoTopo.classList.remove('sem-contador');
  textoVoltar.textContent = 'Voltar para a vaga';
  mostrar('form');
  linkVoltar.hidden = !vaga;
}

function irParaLista(){
  editandoId = null;
  tituloPagina.textContent = 'Suas vagas';
  subtituloPagina.textContent = 'Clique em uma vaga para ver a descrição e os candidatos.';
  textoBotaoTopo.textContent = 'Nova vaga';
  botaoTopo.classList.add('sem-contador');
  renderizarLista();
  mostrar('lista');
  linkVoltar.hidden = true;
}

async function irParaDetalhe(id){
  editandoId = null;
  const vaga = vagas.find(v => v.id === id);
  if(!vaga){ irParaLista(); return; }
  tituloPagina.textContent = 'Detalhes da vaga';
  subtituloPagina.textContent = 'Veja a descrição, edite a vaga e confira quem se candidatou.';
  textoBotaoTopo.textContent = 'Nova vaga';
  botaoTopo.classList.add('sem-contador');
  textoVoltar.textContent = 'Voltar para Suas Vagas';
  telaDetalhe.innerHTML = '<p class="msg-inline">Carregando...</p>';
  mostrar('detalhe');
  linkVoltar.hidden = false;
  try{
    const cands = await Api.get(CONFIG.ANUNCIO_ENDPOINT + '/' + id + '/candidaturas');
    renderizarDetalhe(vaga, cands);
  }catch(e){
    telaDetalhe.innerHTML = '<p class="msg-inline erro">' + esc(e.message) + '</p>';
  }
}

function renderizarLista(){
  const ul = $('listaVagas');
  ul.innerHTML = '';
  $('estadoVazioVagas').hidden = vagas.length > 0;
  vagas.forEach(v => {
    const li = document.createElement('li');
    const qtd = v.totalCandidaturas;
    li.innerHTML =
      '<button type="button" class="card-vaga" data-id="' + v.id + '">' +
        '<div class="linha-topo"><h3>' + esc(v.titulo) + (v.urgente ? ' 🔥' : '') + '</h3>' +
        '<span class="selo-status ' + classeStatus(v.status) + '">' + rotulo(v.status) + '</span></div>' +
        '<div class="meta"><span>' + ICONES.pin + esc(v.habilidade.nome) + '</span>' +
        '<span>' + ICONES.cal + 'Publicada em ' + fmtData(v.dataCriacao) + '</span></div>' +
        '<div class="rodape-card"><span class="valor">' + fmtValor(v.valorProposto) + '</span>' +
        '<span>' + qtd + (qtd === 1 ? ' candidato' : ' candidatos') + '</span></div>' +
      '</button>';
    ul.appendChild(li);
  });
}

function renderizarDetalhe(v, cands){
  let html =
    '<div class="cartao-detalhe">' +
      '<div class="linha-topo"><h2>' + esc(v.titulo) + '</h2>' +
      '<span class="selo-status ' + classeStatus(v.status) + '">' + rotulo(v.status) + '</span></div>' +
      '<div class="grade-meta">' +
        '<div class="meta-detalhe"><small>' + ICONES.pin + 'Categoria</small><strong>' + esc(v.habilidade.nome) + '</strong></div>' +
        '<div class="meta-detalhe"><small>' + ICONES.cash + 'Valor</small><strong>' + fmtValor(v.valorProposto) + '</strong></div>' +
        '<div class="meta-detalhe"><small>' + ICONES.cal + 'Publicação</small><strong>' + fmtData(v.dataCriacao) + '</strong></div>' +
        '<div class="meta-detalhe"><small>' + ICONES.users + 'Candidatos</small><strong>' + cands.length + '</strong></div>' +
      '</div>' +
      '<h4>Descrição</h4>' +
      '<p class="texto-descricao">' + (v.descricao ? esc(v.descricao) : 'Sem descrição informada.') + '</p>' +
      '<div class="acoes-detalhe"><button type="button" class="botao-primario botao-editar" id="botaoEditar" data-id="' + v.id + '">' +
        ICONES.edit + 'Editar vaga</button>' +
        '<button type="button" class="botao-excluir-vaga' + (v.status === 'Cancelada' ? ' destaque' : '') + '" id="botaoExcluirDetalhe" data-id="' + v.id + '">Excluir vaga</button></div>' +
      (v.status === 'Cancelada' ? '<p class="msg-inline">Esta vaga está cancelada. Você pode excluí-la definitivamente.</p>' : '') +
    '</div>' +
    '<div class="titulo-candidatos">Candidatos <span>' + cands.length + '</span></div>';

  if(cands.length === 0){
    html += '<div class="estado-vazio" style="margin:0;max-width:520px">' +
      '<p class="titulo-vazio">Nenhum candidato até agora</p>' +
      '<p class="texto-vazio">Quando freelancers se candidatarem, eles aparecerão aqui com as informações de contato.</p></div>';
  }else{
    html += '<ul class="lista-candidatos">';
    cands.forEach(c => {
      const f = c.freelancer;
      const tel = String(f.telefone || '').replace(/\D/g, '');
      const pendente = c.status === 'Pendente';
      html +=
        '<li class="card-candidato">' +
          (f.fotoUrl
            ? '<img class="avatar-candidato avatar-foto-c" src="' + esc(f.fotoUrl) + '" alt="">'
            : '<div class="avatar-candidato">' + esc(Util.iniciais(f.nome)) + '</div>') +
          '<div class="info-candidato">' +
            '<h5>' + esc(f.nome) + ' <span class="selo-status ' + classeStatus(c.status) + '">' + rotulo(c.status) + '</span></h5>' +
            '<p class="funcao">' + esc(f.funcao || '') + (f.endereco ? ' · ' + esc(Util.local(f.endereco)) : '') + '</p>' +
            (c.mensagem ? '<p class="bio"><em>“' + esc(c.mensagem) + '”</em></p>' : (f.bio ? '<p class="bio">' + esc(f.bio) + '</p>' : '')) +
            '<div class="contatos-candidato">' +
              (f.email ? '<a href="mailto:' + esc(f.email) + '">' + esc(f.email) + '</a>' : '') +
              (f.telefone ? '<a href="tel:+55' + esc(tel) + '">' + esc(f.telefone) + '</a>' : '') +
            '</div>' +
            '<div class="acoes-candidato">' +
              (linkWhatsApp(f.telefone, f.nome, v.titulo)
                ? '<a class="btn-whatsapp" href="' + esc(linkWhatsApp(f.telefone, f.nome, v.titulo)) + '" target="_blank" rel="noopener noreferrer" title="Conversar no WhatsApp">' + ICONE_WHATS + 'WhatsApp</a>'
                : '') +
              '<a href="visualizar-perfil.html?id=' + f.id + '">Ver perfil</a>' +
              (pendente ? '<button type="button" class="aceitar" data-cand="' + c.id + '" data-status="Aceita">Aceitar</button>' +
                          '<button type="button" data-cand="' + c.id + '" data-status="Recusada">Recusar</button>' : '') +
            '</div>' +
          '</div>' +
          '<span class="data-candidatura">Candidatou-se em ' + fmtData(c.dataCriacao) + '</span>' +
        '</li>';
    });
    html += '</ul>';
  }
  telaDetalhe.innerHTML = html + '<p class="msg-inline erro" id="erroDetalhe"></p>';
}

function limparErros(){
  ['erroNome', 'erroCategoria'].forEach(id => $(id).classList.remove('visivel'));
}

$('valorVaga').addEventListener('blur', (e) => {
  const n = lerValor(e.target.value);
  e.target.value = n ? fmtValor(n) : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparErros();
  erroGeral('');
  const titulo = $('nomeVaga').value.trim();
  const textoCategoria = $('categoriaVaga').value.trim();
  let ok = true;
  if(!titulo){ $('erroNome').classList.add('visivel'); ok = false; }
  if(!textoCategoria){ $('erroCategoria').classList.add('visivel'); ok = false; }
  if(!ok){ (titulo ? $('categoriaVaga') : $('nomeVaga')).focus(); return; }

  let habilidadeId = categoriaId;
  const botaoSalvar = $('botaoSalvar');
  botaoSalvar.disabled = true;
  try{
    if(!habilidadeId) habilidadeId = await Categorias.resolver(textoCategoria);
  }catch(erro){
    erroGeral(erro.message);
    botaoSalvar.disabled = false;
    return;
  }

  const dados = {
    titulo,
    habilidadeId,
    status: $('statusVaga').value,
    urgente: $('urgenteVaga').checked,
    valorProposto: lerValor($('valorVaga').value),
    descricao: $('descricaoVaga').value.trim()
  };

  const botao = botaoSalvar;
  try{
    const salva = editandoId
      ? await Api.put(CONFIG.ANUNCIO_ENDPOINT + '/' + editandoId, dados)
      : await Api.post(CONFIG.ANUNCIO_ENDPOINT, dados);
    await recarregarVagas();
    await irParaDetalhe(salva.id);
  }catch(erro){
    erroGeral(erro.message);
  }finally{
    botao.disabled = false;
  }
});

$('botaoCancelar').addEventListener('click', () => {
  if(editandoId){ irParaDetalhe(editandoId); }
  else{ irParaForm(null); }
});

$('botaoExcluir').addEventListener('click', async () => {
  if(!editandoId) return;
  if(!confirm('Excluir esta vaga e suas candidaturas? Essa ação não pode ser desfeita.')) return;
  try{
    await Api.del(CONFIG.ANUNCIO_ENDPOINT + '/' + editandoId);
    await recarregarVagas();
    irParaLista();
  }catch(erro){
    erroGeral(erro.message);
  }
});

botaoTopo.addEventListener('click', () => {
  if(tela === 'form') irParaLista();
  else irParaForm(null);
});

linkVoltar.addEventListener('click', (e) => {
  e.preventDefault();
  if(tela === 'form' && editandoId) irParaDetalhe(editandoId);
  else irParaLista();
});

telaLista.addEventListener('click', (e) => {
  const card = e.target.closest('.card-vaga');
  if(card) irParaDetalhe(Number(card.dataset.id));
});

telaDetalhe.addEventListener('click', async (e) => {
  const excluir = e.target.closest('#botaoExcluirDetalhe');
  if(excluir){
    if(!confirm('Excluir esta vaga e todas as candidaturas? Essa ação não pode ser desfeita.')) return;
    try{
      await Api.del(CONFIG.ANUNCIO_ENDPOINT + '/' + excluir.dataset.id);
      await recarregarVagas();
      irParaLista();
    }catch(erro){
      const alvo = $('erroDetalhe'); if(alvo) alvo.textContent = erro.message;
    }
    return;
  }

  const editar = e.target.closest('#botaoEditar');
  if(editar){ irParaForm(Number(editar.dataset.id)); return; }

  const acao = e.target.closest('[data-cand]');
  if(acao){
    acao.disabled = true;
    try{
      await Api.put(CONFIG.ANUNCIO_ENDPOINT + '/candidaturas/' + acao.dataset.cand + '/status', { status: acao.dataset.status });
      const idVaga = Number(document.getElementById('botaoEditar').dataset.id);
      await recarregarVagas();
      await irParaDetalhe(idVaga);
    }catch(erro){
      acao.disabled = false;
      const alvo = $('erroDetalhe');
      if(alvo) alvo.textContent = erro.message;
    }
  }
});

(async () => {
  try{
    await recarregarVagas();
    if(vagas.length) irParaLista(); else irParaForm(null);
  }catch(erro){
    irParaForm(null);
    erroGeral(erro.message);
  }
})();
