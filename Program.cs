using Microsoft.EntityFrameworkCore;
using ConectaFree.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Controllers = endpoints de API (sem Views, sem Razor)
builder.Services.AddControllers();

// Necessário pra Swagger funcionar (documentação/teste da API)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conexão com o banco (Supabase via Npgsql)
builder.Services.AddDbContext<ConectaFreeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Sem HTTPS redirect - você já teve problema de certificado no Linux antes
// app.UseHttpsRedirection();

app.UseCors("DevCors");

app.UseAuthorization();

app.MapControllers();

app.Run();