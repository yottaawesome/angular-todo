using TodoServer.DataAccess;
using TodoServer.Services;
using TodoServer.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddSingleton<ITodoDataStore, InMemoryTodoStore>();
builder.Services.AddSingleton<TodoService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

TodoEndpoints.MapTodoEndpoints(app);

app.Run();

public partial class Program { }
