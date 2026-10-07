using AutoTrade.Api.Middleware;
using AutoTrade.Infrastructure;
using AutoTrade.Infrastructure.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers with String Enum support
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Auto Trade Live API", Version = "v1", Description = "Live Upstox Trading Platform for Vodafone Idea Limited (NSE: IDEA)" });
});

// Add Infrastructure & Application services
builder.Services.AddInfrastructure(builder.Configuration);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebAndMobile", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "https://localhost:5173", 
                "http://localhost:3000",
                "http://localhost:8081",
                "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowWebAndMobile");

app.UseAuthorization();

app.MapControllers();

// SignalR Hub endpoint
app.MapHub<TradingHub>("/hubs/trading");

app.Run();
