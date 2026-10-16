using System.Text;
using ConectaFree.Data;
using ConectaFree.Interfaces;
using ConectaFree.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger com botão "Authorize" (cole apenas o token JWT, sem a palavra Bearer)
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "ConectaFree API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Faça login em /api/Usuarios/login e cole aqui o token retornado."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

// Banco (Supabase / PostgreSQL)
builder.Services.AddDbContext<ConectaFreeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

builder.Services.AddHttpClient();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddScoped<IAnuncioService, AnuncioService>();
builder.Services.AddScoped<IStorageService, StorageService>();

// CORS só é necessário se o front for servido em outra origem (Vite, Live Server...)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5500", "http://127.0.0.1:5500")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Configure Jwt:Key no appsettings.");

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

// Cria/atualiza as tabelas automaticamente ao iniciar (inclui a tabela Candidaturas)
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ConectaFreeDbContext>();
        db.Database.Migrate();
        logger.LogInformation("Banco de dados atualizado com sucesso.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Falha ao conectar/migrar o banco. Verifique ConnectionStrings:SupabaseConnection.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ConectaFree API v1");
        c.RoutePrefix = "swagger";
    });
}

// app.UseHttpsRedirection(); // desativado: problema de certificado no Linux

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    // Evita o navegador usar JS/CSS antigo em cache durante o desenvolvimento
    OnPrepareResponse = ctx =>
    {
        if (app.Environment.IsDevelopment())
            ctx.Context.Response.Headers["Cache-Control"] = "no-store";
    }
});

app.UseCors("DevCors");
app.UseAuthentication(); // antes de UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();
