using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ConectaFree.Data;
using ConectaFree.Interfaces;
using ConectaFree.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conexão com o banco (Supabase via Npgsql)
builder.Services.AddDbContext<ConectaFreeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

// Injeta a Service no Controller através da Interface
builder.Services.AddScoped<IUsuarioService, UsuarioService>();

// CORS - libera o frontend (Vite/React) a chamar essa API
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configura autenticação JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Sem HTTPS redirect - problema de certificado no Linux
// app.UseHttpsRedirection();
app.UseDefaultFiles(); 
app.UseStaticFiles();

app.UseCors("DevCors");

app.UseAuthentication(); // precisa vir ANTES de UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();