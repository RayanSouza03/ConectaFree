using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using ConectaFree.Data;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using ConectaFree.Models;

namespace ConectaFree.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly ConectaFreeDbContext _context;
        private readonly IConfiguration _config;
        private readonly IStorageService _storage;
        private readonly ICnpjService _cnpj;
        private readonly IEmailService _email;

        public UsuarioService(ConectaFreeDbContext context, IConfiguration config, IStorageService storage,
            ICnpjService cnpj, IEmailService email)
        {
            _context = context;
            _config = config;
            _storage = storage;
            _cnpj = cnpj;
            _email = email;
        }

        private IQueryable<Usuario> ComDetalhes() =>
            _context.Usuarios.Include(u => u.Endereco).Include(u => u.Habilidades);

        public async Task<PerfilRespostaDto> ObterPerfilAsync(int usuarioId)
        {
            var usuario = await ComDetalhes().AsNoTracking().FirstOrDefaultAsync(u => u.Id == usuarioId)
                ?? throw new InvalidOperationException("Usuário não encontrado.");
            return Mapeamento.ParaPerfil(usuario);
        }

        public async Task<PerfilPublicoDto> ObterPublicoAsync(int usuarioId)
        {
            var usuario = await ComDetalhes().AsNoTracking().FirstOrDefaultAsync(u => u.Id == usuarioId)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");
            return Mapeamento.ParaPublico(usuario);
        }

        public async Task<string> AtualizarFotoAsync(int usuarioId, IFormFile foto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId)
                ?? throw new InvalidOperationException("Usuário não encontrado.");

            var url = await _storage.UploadAsync(foto, $"perfil/{usuarioId}");
            usuario.FotoUrl = url;
            usuario.DataAtualizacao = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return url;
        }

        public async Task<Usuario> CadastrarAsync(CadastroUsuarioDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email == email);
            if (emailExiste)
                throw new InvalidOperationException("Email já cadastrado.");

            var documento = DocumentoValidador.Digitos(dto.Documento);
            if (documento.Length != 11 && documento.Length != 14)
                throw new InvalidOperationException("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
            if (await _context.Usuarios.AnyAsync(u => u.Documento == documento))
                throw new InvalidOperationException("Já existe uma conta com este CPF/CNPJ.");

            var nome = dto.Nome.Trim();
            Endereco? endereco = null;

            // CNPJ: confere na Receita (BrasilAPI). Razão social e endereço vêm de lá, não do formulário.
            if (documento.Length == 14)
            {
                var empresa = await ValidarCnpjAsync(documento);
                nome = empresa.RazaoSocial;
                endereco = new Endereco
                {
                    Cep = empresa.Endereco.Cep,
                    Logradouro = empresa.Endereco.Logradouro,
                    Numero = empresa.Endereco.Numero,
                    Complemento = empresa.Endereco.Complemento,
                    Bairro = empresa.Endereco.Bairro,
                    Cidade = empresa.Endereco.Cidade,
                    Estado = empresa.Endereco.Estado
                };
            }

            var usuario = new Usuario
            {
                Nome = nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Telefone = dto.Telefone,
                Documento = documento,
                TipoUsuario = dto.TipoUsuario,
                AceitouTermos = dto.AceitouTermos,
                DataAceiteTermos = dto.AceitouTermos ? DateTime.UtcNow : null,
                VersaoTermosAceita = dto.AceitouTermos ? TermosDeUso.Versao : null,
                Endereco = endereco,
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return usuario;
        }

        private async Task<DadosCnpj> ValidarCnpjAsync(string cnpj)
        {
            if (!DocumentoValidador.CnpjValido(cnpj))
                throw new InvalidOperationException("CNPJ inválido. Confira os números.");

            DadosCnpj? dados;
            try
            {
                dados = await _cnpj.ConsultarAsync(cnpj);
            }
            catch (CnpjIndisponivelException)
            {
                throw new InvalidOperationException("Não foi possível validar o CNPJ agora. Tente novamente em instantes.");
            }

            if (dados is null)
                throw new InvalidOperationException("CNPJ não encontrado na Receita Federal.");
            if (!dados.Ativa)
                throw new InvalidOperationException($"Este CNPJ está com situação cadastral \"{dados.Situacao}\". Só é possível cadastrar empresas ativas.");

            return dados;
        }

        // Limites do bloqueio por conta: 5 erros seguidos => 15 minutos sem conseguir entrar
        private const int MaxTentativasLogin = 5;
        private static readonly TimeSpan TempoBloqueio = TimeSpan.FromMinutes(15);

        // Hash falso: confere a senha mesmo quando o e-mail não existe, para o tempo de resposta não revelar quem tem conta
        private static readonly string HashFalso = BCrypt.Net.BCrypt.HashPassword("senha-falsa-nao-usada");

        public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

            if (usuario == null)
            {
                BCrypt.Net.BCrypt.Verify(dto.Senha, HashFalso);
                return null;
            }

            // Conta bloqueada: nem confere a senha (quem acertar agora também espera o prazo acabar)
            if (usuario.BloqueadoAte.HasValue && usuario.BloqueadoAte.Value > DateTime.UtcNow)
            {
                var minutos = (int)Math.Ceiling((usuario.BloqueadoAte.Value - DateTime.UtcNow).TotalMinutes);
                throw new ContaBloqueadaException(minutos);
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
            {
                usuario.TentativasLogin++;
                if (usuario.TentativasLogin >= MaxTentativasLogin)
                {
                    usuario.BloqueadoAte = DateTime.UtcNow.Add(TempoBloqueio);
                    usuario.TentativasLogin = 0;
                }
                await _context.SaveChangesAsync();
                return null;
            }

            // Acertou: zera o contador
            if (usuario.TentativasLogin > 0 || usuario.BloqueadoAte.HasValue)
            {
                usuario.TentativasLogin = 0;
                usuario.BloqueadoAte = null;
                await _context.SaveChangesAsync();
            }

            return MontarLogin(usuario);
        }

        private LoginResponseDto MontarLogin(Usuario usuario) => new()
        {
            Token = GerarToken(usuario),
            Nome = usuario.Nome,
            Email = usuario.Email,
            TipoUsuario = usuario.TipoUsuario,
            // Quem nunca aceitou, ou aceitou uma versão antiga, precisa aceitar de novo
            PrecisaAceitarTermos = !usuario.AceitouTermos || usuario.VersaoTermosAceita != TermosDeUso.Versao
        };

        // Registra o aceite da versão vigente dos termos (data e versão ficam guardadas como comprovação)
        public async Task AceitarTermosAsync(int usuarioId)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId)
                ?? throw new InvalidOperationException("Usuário não encontrado.");

            usuario.AceitouTermos = true;
            usuario.DataAceiteTermos = DateTime.UtcNow;
            usuario.VersaoTermosAceita = TermosDeUso.Versao;
            await _context.SaveChangesAsync();
        }

        // ---------- Google Identity Services ----------
        // O front recebe um ID token do Google; aqui conferimos assinatura, validade e se foi emitido para o nosso Client ID.
        public async Task<GoogleLoginResultado> LoginGoogleAsync(GoogleLoginDto dto)
        {
            var clientId = _config["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                throw new InvalidOperationException("Login com Google não está configurado.");

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential,
                    new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
            }
            catch (InvalidJwtException)
            {
                throw new InvalidOperationException("Não foi possível validar o login com o Google. Tente novamente.");
            }

            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
                throw new InvalidOperationException("A conta Google precisa ter o e-mail verificado.");

            var email = payload.Email.Trim().ToLowerInvariant();
            var existente = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
            if (existente != null)
                return new GoogleLoginResultado { Login = MontarLogin(existente) };

            // Conta nova: o Google não informa tipo, telefone nem CPF/CNPJ. Peça esses dados na tela de cadastro.
            var nomeInformado = string.IsNullOrWhiteSpace(dto.Nome) ? payload.Name : dto.Nome;
            if (dto.TipoUsuario is null || string.IsNullOrWhiteSpace(dto.Telefone) ||
                string.IsNullOrWhiteSpace(dto.Documento) || dto.AceitouTermos != true)
            {
                return new GoogleLoginResultado { PrecisaCadastro = true, Nome = nomeInformado, Email = email };
            }

            var novo = await CadastrarAsync(new CadastroUsuarioDto
            {
                Nome = string.IsNullOrWhiteSpace(nomeInformado) ? email : nomeInformado,
                Email = email,
                // Sem senha própria: sorteia uma que ninguém conhece (dá para definir uma depois em "Esqueci a senha")
                Senha = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)),
                Telefone = dto.Telefone!,
                Documento = dto.Documento!,
                TipoUsuario = dto.TipoUsuario.Value,
                AceitouTermos = true
            });

            return new GoogleLoginResultado { Login = MontarLogin(novo) };
        }

        // ---------- Esqueci a senha ----------
        // Token sem tabela: um JWT assinado com a chave do app + o hash da senha ATUAL.
        // Quando a senha muda, o hash muda e o link antigo deixa de valer (uso único).
        private const string EmissorReset = "ConectaFree-reset";

        private SymmetricSecurityKey ChaveReset(Usuario usuario) =>
            new(Encoding.UTF8.GetBytes($"{_config["Jwt:Key"]}|reset|{usuario.SenhaHash}"));

        public async Task SolicitarRedefinicaoSenhaAsync(string email)
        {
            var emailNormalizado = email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailNormalizado);
            if (usuario == null) return; // não revela se o e-mail existe

            var jwt = new JwtSecurityToken(
                issuer: EmissorReset,
                claims: new[] { new Claim("uid", usuario.Id.ToString()), new Claim("fim", "reset-senha") },
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: new SigningCredentials(ChaveReset(usuario), SecurityAlgorithms.HmacSha256));

            var token = new JwtSecurityTokenHandler().WriteToken(jwt);
            var baseUrl = (_config["App:BaseUrl"] ?? "http://localhost:5153").TrimEnd('/');
            var link = $"{baseUrl}/recuperar-senha.html?token={Uri.EscapeDataString(token)}";

            _email.Enfileirar(usuario.Email, usuario.Nome, "Redefinir sua senha - ConectaFree",
                EmailTemplates.RedefinirSenha(usuario.Nome, link));
        }

        public async Task RedefinirSenhaAsync(string token, string novaSenha)
        {
            const string invalido = "Link inválido ou expirado. Peça um novo.";
            var handler = new JwtSecurityTokenHandler();

            int usuarioId;
            try
            {
                var lido = handler.ReadJwtToken(token); // ainda sem confiar: só para saber de quem é
                usuarioId = int.Parse(lido.Claims.First(c => c.Type == "uid").Value);
            }
            catch
            {
                throw new InvalidOperationException(invalido);
            }

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId)
                ?? throw new InvalidOperationException(invalido);

            try
            {
                handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = EmissorReset,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = ChaveReset(usuario)
                }, out var validado);

                if (((JwtSecurityToken)validado).Claims.FirstOrDefault(c => c.Type == "fim")?.Value != "reset-senha")
                    throw new SecurityTokenException();
            }
            catch (Exception ex) when (ex is SecurityTokenException || ex is ArgumentException)
            {
                throw new InvalidOperationException(invalido);
            }

            usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
            usuario.TentativasLogin = 0;   // trocar a senha por e-mail destrava a conta
            usuario.BloqueadoAte = null;
            usuario.DataAtualizacao = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<PerfilRespostaDto> AtualizarPerfilAsync(int usuarioId, AtualizarPerfilDto dto)
        {
            if (FiltroPalavras.Contem(dto.OutraHabilidade))
                throw new InvalidOperationException("Uma das habilidades informadas contém termo não permitido.");

            var usuario = await _context.Usuarios
                .Include(u => u.Endereco)
                .Include(u => u.Habilidades)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario == null)
                throw new InvalidOperationException("Usuário não encontrado.");

            if (!string.IsNullOrWhiteSpace(dto.Nome))
                usuario.Nome = dto.Nome;

            if (!string.IsNullOrWhiteSpace(dto.Telefone))
                usuario.Telefone = dto.Telefone;

            if (dto.Bio != null)
                usuario.Bio = dto.Bio;

            if (dto.RemoverFoto)
                usuario.FotoUrl = null;
            else if (dto.FotoUrl != null)
                usuario.FotoUrl = dto.FotoUrl;

            if (dto.HabilidadeIds != null)
            {
                if (usuario.TipoUsuario == TipoUsuario.Contratante && dto.HabilidadeIds.Any())
                    throw new InvalidOperationException("Contratantes não podem ter habilidades.");

                var habilidades = await _context.Habilidades
                    .Where(h => dto.HabilidadeIds.Contains(h.Id))
                    .ToListAsync();

                usuario.Habilidades = habilidades;
            }

            if (dto.OutraHabilidade != null)
            {
                if (usuario.TipoUsuario == TipoUsuario.Contratante)
                    throw new InvalidOperationException("Contratantes não podem ter habilidades.");

                usuario.OutraHabilidade = dto.OutraHabilidade;
            }

            if (dto.Endereco != null)
            {
                if (usuario.Endereco == null)
                {
                    usuario.Endereco = new Endereco
                    {
                        Logradouro = dto.Endereco.Logradouro,
                        Numero = dto.Endereco.Numero,
                        Complemento = dto.Endereco.Complemento,
                        Bairro = dto.Endereco.Bairro,
                        Cidade = dto.Endereco.Cidade,
                        Estado = dto.Endereco.Estado,
                        Cep = dto.Endereco.Cep
                    };
                }
                else
                {
                    usuario.Endereco.Logradouro = dto.Endereco.Logradouro;
                    usuario.Endereco.Numero = dto.Endereco.Numero;
                    usuario.Endereco.Complemento = dto.Endereco.Complemento;
                    usuario.Endereco.Bairro = dto.Endereco.Bairro;
                    usuario.Endereco.Cidade = dto.Endereco.Cidade;
                    usuario.Endereco.Estado = dto.Endereco.Estado;
                    usuario.Endereco.Cep = dto.Endereco.Cep;
                }
            }

            usuario.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Mapeamento.ParaPerfil(usuario);
        }

        private string GerarToken(Usuario usuario)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Role, usuario.TipoUsuario.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(30), // sessao longa: so sai ao clicar em Sair
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        public async Task<List<PerfilPublicoDto>> FiltrarFreelancersAsync(FiltroFreelancerDto filtro)
        {
            
            var query = _context.Usuarios
                .Include(u => u.Endereco)
                .Include(u => u.Habilidades)
                .Where(u => u.TipoUsuario == TipoUsuario.Freelancer)
                .AsQueryable();

            if (filtro.HabilidadeId.HasValue)
                query = query.Where(u => u.Habilidades.Any(h => h.Id == filtro.HabilidadeId.Value));

            if (!string.IsNullOrWhiteSpace(filtro.Cidade))
                query = query.Where(u => u.Endereco != null && EF.Functions.ILike(u.Endereco.Cidade, "%" + filtro.Cidade.Trim().Replace("%", "").Replace("_", "") + "%"));

            if (!string.IsNullOrWhiteSpace(filtro.Estado))
                query = query.Where(u => u.Endereco != null && EF.Functions.ILike(u.Endereco.Estado, filtro.Estado.Trim().Replace("%", "").Replace("_", "")));

            var lista = await query.AsNoTracking().OrderBy(u => u.Nome).ToListAsync();
            return lista.Select(Mapeamento.ParaPublico).ToList();
        }
    }
}