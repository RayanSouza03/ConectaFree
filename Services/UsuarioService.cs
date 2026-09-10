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

        public UsuarioService(ConectaFreeDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }
        
        public async Task<Usuario> CadastrarAsync(CadastroUsuarioDto dto)
        {
            var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email == dto.Email);
            if(emailExiste)
                throw new InvalidOperationException ("Email já cadastrado.");

            var usuario = new Usuario
            {
                Nome = dto.Nome,
                Email = dto.Email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                Telefone = dto.Telefone,
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
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email);

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
                expires: DateTime.UtcNow.AddHours(8), // token expira em 8h
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}