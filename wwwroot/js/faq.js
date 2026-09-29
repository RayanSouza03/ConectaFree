const FAQ = [
  {c:"Sobre a plataforma", p:"O que é o ConectaFree?", r:"O ConectaFree é um ecossistema digital centralizado que conecta profissionais autônomos (freelancers) a contratantes para facilitar a busca e a oferta de serviços de curta duração ou urgentes."},
  {c:"Sobre a plataforma", p:"Quais são as principais funcionalidades disponíveis na plataforma?", r:"Atualmente o sistema conta com ferramentas essenciais de busca, filtros, edição de perfil e portfólio."},
  {c:"Sobre a plataforma", p:"Quais funcionalidades não estão presentes nesta versão?", r:"Funcionalidades como o chat interno de mensagens e o sistema de avaliações/reputação bilateral não fazem parte desta versão do sistema."},
  {c:"Sobre a plataforma", p:"Quem são os usuários que podem utilizar a plataforma?", r:"A plataforma atende freelancers (profissionais autônomos), contratantes (empresas ou pessoas físicas) e administradores responsáveis pela moderação."},
  {c:"Sobre a plataforma", p:"Como o ConectaFree me ajuda a economizar tempo?", r:"Ele centraliza em um único ambiente digital a vitrine de profissionais e vagas, evitando que você precise procurar em múltiplas redes sociais fragmentadas."},
  {c:"Cadastro e conta", p:"Como faço para me cadastrar no ConectaFree?", r:"O processo é feito diretamente na página inicial da plataforma, onde você informa seus dados básicos e define se atuará como freelancer ou contratante."},
  {c:"Cadastro e conta", p:"Posso alterar meu tipo de conta após o cadastro?", r:"Para dúvidas sobre alterações profundas no tipo de conta, é necessário consultar as diretrizes de suporte técnico ou refazer o cadastro conforme o perfil desejado."},
  {c:"Cadastro e conta", p:"Como funciona a segurança dos meus dados de cadastro?", r:"A plataforma segue padrões rigorosos de segurança e validação de identidade, como verificação de documentos e selfies, gerenciados pelo administrador."},
  {c:"Cadastro e conta", p:"O que acontece se eu esquecer minha senha de acesso?", r:"Você pode utilizar a opção de recuperação de senha na tela de login para receber instruções de redefinição no e-mail cadastrado."},
  {c:"Cadastro e conta", p:"Existe custo para criar uma conta básica no ConectaFree?", r:"O cadastro inicial e o uso das funcionalidades básicas da vitrine seguem o modelo estruturado do projeto, que também prevê planos Premium opcionais."},
  {c:"Perfil e portfólio", p:"Como faço para atualizar meus dados pessoais e profissionais?", r:"Basta acessar a seção de edição de perfil em sua conta para modificar informações de contato, especialidades e dados cadastrais."},
  {c:"Perfil e portfólio", p:"O que é o Portfólio dentro da plataforma?", r:"É a vitrine digital exclusiva do freelancer, onde é possível expor imagens, links e descrições dos melhores trabalhos já realizados para atrair contratantes."},
  {c:"Perfil e portfólio", p:"Qualquer usuário pode visualizar o meu portfólio?", r:"Sim. O portfólio tem caráter público na sua página de perfil, para que potenciais contratantes possam analisar a sua qualidade técnica."},
  {c:"Perfil e portfólio", p:"Posso adicionar links externos no meu portfólio?", r:"Sim, você pode adicionar links que comprovem a sua experiência e facilitem a visualização dos projetos concluídos."},
  {c:"Perfil e portfólio", p:"Há limite para a quantidade de itens do portfólio?", r:"O armazenamento e a exibição seguem os parâmetros definidos pelo sistema para garantir boa performance na navegação dos visitantes."},
  {c:"Busca e filtros", p:"Como encontro um freelancer para o meu projeto?", r:"Utilizando a ferramenta de busca combinada com os filtros disponíveis para refinar os resultados de acordo com o que você precisa."},
  {c:"Busca e filtros", p:"Quais filtros posso utilizar na hora da busca?", r:"Você pode filtrar os perfis e vagas com base em critérios como geolocalização, categoria de serviço e faixa de preço."},
  {c:"Busca e filtros", p:"É possível buscar profissionais próximos à minha localização?", r:"Sim, o sistema conta com suporte a filtros de geolocalização para facilitar contratações locais ou presenciais urgentes."},
  {c:"Busca e filtros", p:"Como encontro vagas de trabalho se sou freelancer?", r:"Utilizando a mesma barra de busca e os filtros por categoria e preço para localizar anúncios criados por contratantes em aberto."},
  {c:"Negociação e contato", p:"Como entro em contato com o profissional se não há chat?", r:"Como o chat interno não está disponível nesta versão, o alinhamento de prazos, valores e detalhes do serviço deve ser feito pelos canais de contato externos (e-mail ou telefone) informados pelo próprio usuário em seu perfil."},
  {c:"Negociação e contato", p:"Como sei se um profissional é confiável sem avaliações?", r:"Como as notas e comentários pós-serviço foram removidos desta versão, a validação do profissional deve ser feita pela análise rigorosa do portfólio, dos dados de perfil e do alinhamento direto por contatos externos."},
  {c:"Negociação e contato", p:"Posso avaliar o serviço de um freelancer após a conclusão?", r:"Não. O sistema de avaliações bilaterais não está ativo no escopo atual desta versão da plataforma."}
];

const LIMITE = 5;
const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const campo = document.getElementById('busca');
let selecionada = FAQ[0];

const semAcento = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function mostrarResposta(item){
  selecionada = item;
  document.getElementById('categoria').textContent = item.c;
  document.getElementById('titulo').textContent = item.p;
  document.getElementById('resposta').textContent = item.r;
  document.getElementById('rodape').innerHTML =
    'Não encontrou o que procurava? Confira seu <a href="visualizar-perfil.html">perfil</a> ou entre em contato com o suporte.';
  document.querySelectorAll('.pergunta').forEach(b=>{
    b.setAttribute('aria-pressed', b.dataset.p === item.p ? 'true' : 'false');
  });
}

function renderizar(){
  const termo = semAcento(campo.value.trim());
  const achados = termo
    ? FAQ.filter(i => semAcento(i.p + ' ' + i.r + ' ' + i.c).includes(termo))
    : FAQ;

  lista.innerHTML = '';

  if(achados.length === 0){
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = 'Nenhuma pergunta corresponde a "' + campo.value.trim() + '". Tente palavras como portfólio, filtros, senha ou contato.';
    lista.appendChild(li);
    contador.textContent = '';
    return;
  }

  achados.slice(0, LIMITE).forEach(item => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'pergunta';
    btn.type = 'button';
    btn.dataset.p = item.p;
    btn.setAttribute('aria-pressed','false');
    btn.innerHTML = '<span>' + item.p + '</span><span class="seta" aria-hidden="true">›</span>';
    btn.addEventListener('click', () => mostrarResposta(item));
    li.appendChild(btn);
    lista.appendChild(li);
  });

  contador.textContent = achados.length > LIMITE
    ? 'Mostrando 5 de ' + achados.length + ' perguntas. Refine a busca para ver outras.'
    : achados.length + (achados.length === 1 ? ' pergunta encontrada.' : ' perguntas encontradas.');

  if(termo) mostrarResposta(achados[0]);
  else mostrarResposta(selecionada);
}

campo.addEventListener('input', renderizar);
renderizar();
