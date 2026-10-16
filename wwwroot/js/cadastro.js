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

    let tipoConta = 'profissional'; // 'profissional' ou 'empresa'
    let tipoDocEmpresa = 'cnpj';    // 'cnpj' ou 'cpf'

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

        const docAtual = (tipoConta === 'profissional') ? 'cpf' : tipoDocEmpresa;

        if (docAtual === 'cpf') {
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
        const docTipo = (tipoConta === 'profissional') ? 'cpf' : tipoDocEmpresa;
        e.target.value = aplicarMascara(e.target.value, docTipo);
        erroDocumento.classList.remove('visible');
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

    // Submissão do formulário
    formCadastro.addEventListener('submit', async (e) => {
        let valido = true;
        const docTipo = (tipoConta === 'profissional') ? 'cpf' : tipoDocEmpresa;

        if (docTipo === 'cpf') {
            if (!validarCPF(inputDocumento.value)) {
                e.preventDefault();
                erroDocumento.textContent = 'CPF inválido. Por favor, verifique os números.';
                erroDocumento.classList.add('visible');
                valido = false;
            }
        }

        if (inputSenha.value !== inputConfirmarSenha.value) {
            e.preventDefault();
            erroSenha.textContent = 'As senhas não coincidem.';
            erroSenha.classList.add('visible');
            valido = false;
        }

        if (!valido) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        const botaoCadastrar = formCadastro.querySelector('.btn-cadastrar');
        const erroGeral = document.getElementById('erroGeral');
        erroGeral.classList.remove('visible');
        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = 'Criando conta...';

        try {
            const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.CADASTRO_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: inputNome.value.trim(),
                    email: document.getElementById('email').value.trim(),
                    senha: inputSenha.value,
                    telefone: document.getElementById('telefone').value.trim(),
                    documento: inputDocumento.value.replace(/\D/g, ''), // back aceita ate 14 caracteres
                    tipoUsuario: tipoConta === 'profissional' ? 0 : 1,   // 0 Freelancer, 1 Contratante
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
            erroGeral.textContent = erro.message;
            erroGeral.classList.add('visible');
            botaoCadastrar.disabled = false;
            botaoCadastrar.textContent = 'Cadastrar';
        }
    });
});