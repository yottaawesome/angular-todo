using TodoServer.DataAccess;
using TodoServer.Services;
using TodoServer.Endpoints;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "TodoClient";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();

            return;
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<ITodoDataStore, InMemoryTodoStore>();
builder.Services.AddSingleton<TodoService>();

var app = builder.Build();
app.UseCors(CorsPolicyName);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

TodoEndpoints.MapTodoEndpoints(app);

app.Run();

public partial class Program { }
