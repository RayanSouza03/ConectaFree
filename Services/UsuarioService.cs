using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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

        public UsuarioService(ConectaFreeDbContext context, IConfiguration config, IStorageService storage)
        {
            _context = context;
            _config = config;
            _storage = storage;
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

            var usuario = new Usuario
            {
                Nome = dto.Nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Telefone = dto.Telefone,
                Documento = dto.Documento,
                TipoUsuario = dto.TipoUsuario,
                AceitouTermos = dto.AceitouTermos,
                DataAceiteTermos = dto.AceitouTermos ? DateTime.UtcNow : null,
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return usuario;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                return null;

            var token = GerarToken(usuario);

            return new LoginResponseDto
            {
                Token = token,
                Nome = usuario.Nome,
                Email = usuario.Email,
                TipoUsuario = usuario.TipoUsuario
            };
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
                expires: DateTime.UtcNow.AddDays(30),
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
