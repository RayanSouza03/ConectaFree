
# ConectaFree - Parte 1 da integracao Front + Back

## O que foi integrado

1. Login real com a API C#:
   - Front envia `{ email, senha }`.
   - Endpoint usado: `POST /api/Usuarios/login`.
   - O token JWT e salvo no `localStorage`.

2. Roteamento por `TipoUsuario`:
   - `0` / `Freelancer` -> `inicio.html`.
   - `1` / `Contratante` -> login informa que a area ainda nao foi integrada.
   - `2` / `Admin` -> login informa que a area ainda nao foi integrada.

3. Inicio do Freelancer:
   - As vagas nao usam mais os dados ficticios do HTML.
   - O front consulta `GET /api/Anuncio/filtrar`.
   - O backend ja retorna somente `StatusAnuncio.Aberta`.
   - Vagas recentes usam `DataCriacao`.
   - Vagas urgentes usam `Urgente = true`.
   - Categoria vem de `Habilidade.Nome`.
   - Valor vem de `ValorProposto`.
   - Local vem do endereco do contratante quando existir.

## Importante

O front foi colocado dentro do `wwwroot` do ASP.NET. Por isso `API_BASE_URL` esta como `/api`: a API e o front passam a funcionar na mesma origem.

Nao abra `index.html` diretamente pelo explorador de arquivos. Rode o projeto ASP.NET e acesse a URL informada pelo Kestrel.

## Proxima etapa

Integrar cadastro, perfil e portfolio ao back existente e depois detalhar a vaga/candidatura sem perder o layout atual.
