document.addEventListener('DOMContentLoaded', () => {
    const btnProfissional = document.getElementById('btnProfissional');
    const btnEmpresa = document.getElementById('btnEmpresa');
    const opcaoDocEmpresa = document.getElementById('opcaoDocEmpresa');
    const btnCNPJ = document.getElementById('btnCNPJ');
    const btnCPF = document.getElementById('btnCPF');
    
    const labelNome = document.getElementById('labelNome');
    const inputNome = document.getElementById('nome');
    const labelDocumento = document.getElementById('labelDocumento');
    const inputDocumento = document.getElementById('documento');
    const erroDocumento = document.getElementById('erroDocumento');
    
    const formCadastro = document.getElementById('formCadastro');
    const inputSenha = document.getElementById('senha');
    const inputConfirmarSenha = document.getElementById('confirmarSenha');
    const erroSenha = document.getElementById('erroSenha');

    const statusDocumento = document.getElementById('statusDocumento');
    const cardEmpresa = document.getElementById('cardEmpresa');
    const inputEmail = document.getElementById('email');
    const inputTelefone = document.getElementById('telefone');

    let tipoConta = 'profissional'; // 'profissional' ou 'empresa'
    let tipoDocEmpresa = 'cnpj';    // 'cnpj' ou 'cpf'

    let cnpjValidado = null;        // dados da Receita para o CNPJ digitado (null = ainda não validado)
    let nomePreenchidoPelaReceita = false;
    let consultaAtual = 0;          // descarta respostas de consultas antigas

    // Cadastro vindo do "Entrar com o Google": a conta só é criada aqui, com os dados que o Google não fornece
    const params = new URLSearchParams(window.location.search);
    const credencialGoogle = params.get('google') === '1' ? sessionStorage.getItem('googleCredential') : null;
    if (params.get('google') === '1' && !credencialGoogle) {
        window.location.replace('index.html'); // sessão do Google expirou: recomeça pelo login
        return;
    }
    const modoGoogle = !!credencialGoogle;

    const docAtual = () => (tipoConta === 'profissional' ? 'cpf' : tipoDocEmpresa);

    // SVGs dos ícones de senha
    const svgOlhoAberto = `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const svgOlhoFechado = `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    // Validação real de CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    // Validação dos dígitos verificadores do CNPJ (a Receita confirma depois se existe e está ativo)
    function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

        const dv = (pesos) => {
            const soma = pesos.reduce((acc, p, i) => acc + Number(cnpj[i]) * p, 0);
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };

        return dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[12])
            && dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[13]);
    }

    function definirStatusDocumento(texto, classe) {
        statusDocumento.textContent = texto || '';
        statusDocumento.className = 'status-documento' + (classe ? ' ' + classe : '');
    }

    function limparDadosEmpresa() {
        consultaAtual++;
        cnpjValidado = null;
        cardEmpresa.classList.add('hidden');
        definirStatusDocumento('');
        if (nomePreenchidoPelaReceita) {
            inputNome.value = '';
            inputNome.readOnly = false;
            nomePreenchidoPelaReceita = false;
        }
    }

    function mostrarCardEmpresa(d) {
        const e = d.endereco || {};
        const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
        const cidade = [e.cidade, e.estado].filter(Boolean).join('/');
        // textContent: os dados vêm de uma API externa, nunca como HTML
        document.getElementById('empresaRazao').textContent = d.razaoSocial + (d.nomeFantasia ? ` (${d.nomeFantasia})` : '');
        document.getElementById('empresaSituacao').textContent = `Situação cadastral: ${d.situacao}`;
        document.getElementById('empresaEndereco').textContent = [rua, e.bairro, cidade].filter(Boolean).join(' · ');
        cardEmpresa.classList.remove('hidden');
    }

    // Consulta o CNPJ (BrasilAPI via nosso backend). Devolve os dados se estiver ativo, ou null.
    async function consultarCnpj(digitos) {
        const id = ++consultaAtual;
        cnpjValidado = null;
        cardEmpresa.classList.add('hidden');
        definirStatusDocumento('Consultando a Receita Federal...', 'info');

        try {
            const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.CNPJ_ENDPOINT}/${digitos}`);
            const d = await resposta.json().catch(() => ({}));
            if (id !== consultaAtual) return null; // o usuário já digitou outra coisa

            if (!resposta.ok) {
                definirStatusDocumento(d.erro || 'Não foi possível consultar o CNPJ.', 'erro');
                return null;
            }
            if (!d.ativa) {
                definirStatusDocumento(`CNPJ com situação "${d.situacao}". Só é possível cadastrar empresas ativas.`, 'erro');
                return null;
            }

            cnpjValidado = d;
            inputNome.value = d.razaoSocial;      // razão social vem da Receita
            inputNome.readOnly = true;
            nomePreenchidoPelaReceita = true;
            mostrarCardEmpresa(d);
            definirStatusDocumento('CNPJ ativo na Receita Federal.', 'ok');
            return d;
        } catch {
            if (id === consultaAtual) definirStatusDocumento('Não foi possível consultar o CNPJ agora. Tente novamente.', 'erro');
            return null;
        }
    }

    // Aplicação das máscaras
    function aplicarMascara(valor, tipo) {
        const apenasNumeros = valor.replace(/\D/g, '');

        if (tipo === 'cpf') {
            return apenasNumeros
                .slice(0, 11)
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')                 .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return apenasNumeros
                .slice(0, 14)
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')                 .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    }

    function atualizarCampos() {
        inputDocumento.value = '';
        erroDocumento.classList.remove('visible');
        limparDadosEmpresa();

        if (docAtual() === 'cpf') {
            labelNome.textContent = 'Nome Completo';
            inputNome.placeholder = 'Digite seu nome completo';
            labelDocumento.textContent = 'CPF';
            inputDocumento.placeholder = '000.000.000-00';
            inputDocumento.maxLength = 14;
        } else {
            labelNome.textContent = 'Razão Social';
            inputNome.placeholder = 'Digite a razão social da empresa';
            labelDocumento.textContent = 'CNPJ';
            inputDocumento.placeholder = '00.000.000/0000-00';
            inputDocumento.maxLength = 18;
        }
    }

    // Toggle Principal
    btnProfissional.addEventListener('click', () => {
        if (tipoConta === 'profissional') return;
        tipoConta = 'profissional';
        btnProfissional.classList.add('active');
        btnEmpresa.classList.remove('active');
        opcaoDocEmpresa.classList.add('hidden');
        atualizarCampos();
    });

    btnEmpresa.addEventListener('click', () => {
        if (tipoConta === 'empresa') return;
        tipoConta = 'empresa';
        btnEmpresa.classList.add('active');
        btnProfissional.classList.remove('active');
        opcaoDocEmpresa.classList.remove('hidden');
        atualizarCampos();
    });

    // Toggle de Documentos em Empresa
    btnCNPJ.addEventListener('click', () => {
        if (tipoDocEmpresa === 'cnpj') return;
        tipoDocEmpresa = 'cnpj';
        btnCNPJ.classList.add('active');
        btnCPF.classList.remove('active');
        atualizarCampos();
    });

    btnCPF.addEventListener('click', () => {
        if (tipoDocEmpresa === 'cpf') return;
        tipoDocEmpresa = 'cpf';
        btnCPF.classList.add('active');
        btnCNPJ.classList.remove('active');
        atualizarCampos();
    });

    // Máscara ao digitar
    inputDocumento.addEventListener('input', (e) => {
        e.target.value = aplicarMascara(e.target.value, docAtual());
        erroDocumento.classList.remove('visible');

        if (docAtual() !== 'cnpj') return;

        const digitos = e.target.value.replace(/\D/g, '');
        if (digitos.length < 14) {
            limparDadosEmpresa();
        } else if (!validarCNPJ(digitos)) {
            limparDadosEmpresa();
            definirStatusDocumento('CNPJ inválido. Confira os números.', 'erro');
        } else if (!cnpjValidado || cnpjValidado.cnpj !== digitos) {
            consultarCnpj(digitos);
        }
    });

    // Alternar visibilidade da senha (SVG)
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const inputTarget = document.getElementById(targetId);
            
            if (inputTarget.type === 'password') {
                inputTarget.type = 'text';
                btn.innerHTML = svgOlhoFechado;
            } else {
                inputTarget.type = 'password';
                btn.innerHTML = svgOlhoAberto;
            }
        });
    });

    inputConfirmarSenha.addEventListener('input', () => {
        erroSenha.classList.remove('visible');
    });

    // Cadastro com Google: nome/e-mail vêm do Google, não tem senha
    if (modoGoogle) {
        let perfilGoogle = {};
        try { perfilGoogle = JSON.parse(sessionStorage.getItem('googlePerfil') || '{}'); } catch { /* segue sem pré-preencher */ }

        document.getElementById('tituloCadastro').textContent = 'Concluir cadastro';
        const aviso = document.getElementById('avisoGoogle');
        aviso.textContent = `Você entrou com o Google${perfilGoogle.email ? ' (' + perfilGoogle.email + ')' : ''}. Falta só completar alguns dados.`;
        aviso.classList.remove('hidden');

        inputEmail.value = perfilGoogle.email || '';
        inputEmail.readOnly = true;
        if (perfilGoogle.nome) inputNome.value = perfilGoogle.nome;

        document.getElementById('grupoSenha').classList.add('hidden');
        document.getElementById('grupoConfirmarSenha').classList.add('hidden');
        inputSenha.required = false;
        inputConfirmarSenha.required = false;
        formCadastro.querySelector('.btn-cadastrar').textContent = 'Concluir cadastro';
    }

    // Submissão do formulário
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const docTipo = docAtual();
        const digitosDoc = inputDocumento.value.replace(/\D/g, '');
        const botaoCadastrar = formCadastro.querySelector('.btn-cadastrar');
        const erroGeral = document.getElementById('erroGeral');
        const textoBotao = modoGoogle ? 'Concluir cadastro' : 'Cadastrar';
        erroGeral.classList.remove('visible');

        const falhar = (elemento, msg) => {
            elemento.textContent = msg;
            elemento.classList.add('visible');
        };

        if (docTipo === 'cpf' && !validarCPF(inputDocumento.value)) {
            falhar(erroDocumento, 'CPF inválido. Por favor, verifique os números.');
            return;
        }

        if (docTipo === 'cnpj' && !validarCNPJ(digitosDoc)) {
            falhar(erroDocumento, 'CNPJ inválido. Por favor, verifique os números.');
            return;
        }

        if (!modoGoogle && inputSenha.value !== inputConfirmarSenha.value) {
            falhar(erroSenha, 'As senhas não coincidem.');
            return;
        }

        botaoCadastrar.disabled = true;

        try {
            // Empresa com CNPJ: só segue se a Receita confirmou (o servidor confere de novo ao salvar)
            if (docTipo === 'cnpj') {
                botaoCadastrar.textContent = 'Validando CNPJ...';
                const empresa = (cnpjValidado && cnpjValidado.cnpj === digitosDoc) ? cnpjValidado : await consultarCnpj(digitosDoc);
                if (!empresa) {
                    falhar(erroDocumento, statusDocumento.textContent || 'Não foi possível validar o CNPJ.');
                    botaoCadastrar.disabled = false;
                    botaoCadastrar.textContent = textoBotao;
                    return;
                }
            }

            botaoCadastrar.textContent = 'Criando conta...';
            const tipoUsuario = tipoConta === 'profissional' ? 0 : 1; // 0 Freelancer, 1 Contratante

            if (modoGoogle) {
                const dados = await AuthService.loginGoogle(credencialGoogle, {
                    nome: inputNome.value.trim(),
                    tipoUsuario,
                    telefone: inputTelefone.value.trim(),
                    documento: digitosDoc,
                    aceitouTermos: document.getElementById('termos').checked,
                });
                if (dados.precisaCadastro) throw new Error('Não foi possível concluir o cadastro. Confira os dados.');

                sessionStorage.removeItem('googleCredential');
                sessionStorage.removeItem('googlePerfil');
                botaoCadastrar.textContent = 'Conta criada! Entrando...';
                AuthService.redirecionarPorTipo(dados.tipoUsuario);
                return;
            }

            const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.CADASTRO_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: inputNome.value.trim(),
                    email: inputEmail.value.trim(),
                    senha: inputSenha.value,
                    telefone: inputTelefone.value.trim(),
                    documento: digitosDoc, // back aceita ate 14 caracteres
                    tipoUsuario,
                    aceitouTermos: document.getElementById('termos').checked,
                }),
            });

            if (!resposta.ok) {
                let msg = 'Nao foi possivel criar a conta.';
                try {
                    const d = await resposta.json();
                    msg = d.erro || (d.errors ? Object.values(d.errors).flat().join(' ') : msg);
                } catch {}
                throw new Error(msg);
            }

            botaoCadastrar.textContent = 'Conta criada! Redirecionando...';
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } catch (erro) {
            falhar(erroGeral, erro.message);
            botaoCadastrar.disabled = false;
            botaoCadastrar.textContent = textoBotao;
        }
    });
});
