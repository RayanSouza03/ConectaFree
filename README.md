# ConectaFree

Marketplace de freelancers — ASP.NET Core (net10) + EF Core + Supabase (PostgreSQL) + front estático em `wwwroot`.

## Como rodar
1. `appsettings.json`:
   - `ConnectionStrings:SupabaseConnection` — sua string do Supabase (use a do *pooler* se a direta falhar).
   - **Fotos e arquivos 100% online (Supabase Storage):** em `Supabase` preencha só `Url` (ex.: `https://xxxx.supabase.co`) e `ServiceRoleKey` (Supabase → Project Settings → API → *service_role*). O bucket `conectafree` é criado sozinho (público). Sem essas duas chaves, os arquivos vão para `wwwroot/uploads` (modo local).
   - A `ServiceRoleKey` é secreta: só no servidor (`appsettings`/user-secrets), nunca no front nem no GitHub.
   - CEP: usa ViaCEP, com BrasilAPI de reserva. Para incluir o Google Maps como 3ª opção, preencha `Google:MapsKey` (Geocoding API).
   - **Não suba esse arquivo para o GitHub.** Prefira `dotnet user-secrets`.
2. `dotnet restore && dotnet run`
3. Ao iniciar, o app aplica as migrations sozinho (cria `Candidaturas`). Confira no terminal: `Banco de dados atualizado com sucesso.`
4. Abra **pela URL do próprio servidor**: `http://localhost:5153` (front) e `http://localhost:5153/swagger` (API).
   Não use Live Server / `file://`: o front chama `/api` na mesma origem.

## Swagger
`POST /api/Usuarios/login` → copie o `token` → botão **Authorize** → cole só o token.

## Fluxo de teste
1. `cadastro.html`: crie um Contratante (Empresa) e um Freelancer (Profissional).
2. Login: Freelancer → `inicio.html`; Contratante → `contratante.html`.
3. Contratante: *Minhas vagas* → postar vaga.
4. Freelancer: início → Ver vaga → Candidatar-se.
5. Contratante: abrir a vaga → Aceitar candidato → editar vaga e marcar **Concluída**.
6. Freelancer: Portfólio → Adicionar → *Vaga concluída*.

## Se você já gerou uma migration própria para Candidatura
Apague-a (`dotnet ef migrations remove`) para não duplicar com `20260929120000_AddCandidatura`.
