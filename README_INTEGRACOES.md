# Integrações (CNPJ, IBGE, Google, e-mail)

Depois de abrir o projeto, rode uma vez `dotnet restore` (novo pacote: `Google.Apis.Auth`).

## Chaves
Use **user-secrets** (não vão para o Git):

```bash
dotnet user-secrets init
dotnet user-secrets set "Google:ClientId" "SEU_ID.apps.googleusercontent.com"
dotnet user-secrets set "Email:ApiKey" "re_xxxxxxxx"            # chave da Resend ou da Brevo
dotnet user-secrets set "Email:RemetenteEmail" "contato@seudominio.com"
```

Em `appsettings.json` ficam só os valores não secretos: `App:BaseUrl` (usada nos links dos e-mails),
`Email:Provedor` (`Resend` ou `Brevo`) e `Email:RemetenteNome`.

## O que cada uma faz
| Integração | Onde | Observações |
|---|---|---|
| BrasilAPI CNPJ | `GET /api/Cnpj/{cnpj}`; cadastro de empresa | Valida dígitos + consulta a Receita. Só aceita CNPJ **ativo**. Razão social e endereço são gravados pelo servidor, não pelo formulário. |
| IBGE Localidades | `GET /api/Localidades/estados` e `/cidades?uf=PR` | Cache de 24h no servidor. Usado no filtro do contratante, no perfil e no endereço da vaga. Se o IBGE cair, UF usa lista fixa e cidade vira texto livre. |
| Google Identity Services | `POST /api/Usuarios/google` | O botão só aparece se `Google:ClientId` estiver configurado. E-mail novo passa pela tela `cadastro.html?google=1` (tipo, telefone, CPF/CNPJ). |
| Resend / Brevo | `Services/EmailService.cs` | Esqueci a senha, novo candidato (para o contratante) e candidatura aceita (para o freelancer). |

## Google Cloud Console
1. APIs e serviços → Credenciais → *Criar credenciais* → **ID do cliente OAuth** → tipo **Aplicativo da Web**.
2. Em **Origens JavaScript autorizadas** adicione `http://localhost:5153` e `https://localhost:7039` (e o domínio de produção).
3. Copie o ID do cliente para `Google:ClientId`. Não precisa de URI de redirecionamento nem de client secret.

## E-mail
- **Resend**: para enviar a qualquer destinatário é preciso verificar um domínio seu. Sem domínio, só envia para o e-mail da própria conta (remetente `onboarding@resend.dev`).
- **Brevo**: basta verificar um e-mail remetente (sem domínio). Use `"Email:Provedor": "Brevo"`.
- Sem chave configurada o app funciona normalmente; o envio só registra um aviso no log.

## Esqueci a senha
O link (`recuperar-senha.html?token=...`) vale 1 hora e só funciona uma vez: o token é assinado junto com o hash da senha atual, então trocar a senha invalida o link. Não há tabela nova nem migração.
