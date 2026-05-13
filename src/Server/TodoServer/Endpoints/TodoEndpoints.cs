using TodoServer.Models;
using TodoServer.Services;

namespace TodoServer.Endpoints;

public static class TodoEndpoints
{
    public static void MapTodoEndpoints(this WebApplication app)
    {
        app.MapGet("/todos", (TodoService service) =>
        {
            return service.GetAll();
        })
        .WithName("GetAllTodoItems");

        app.MapPost("/todos", (TodoItem item, TodoService service) =>
        {
            service.Add(item);
            return Results.Created($"/todos/{item.Id}", item);
        })
        .WithName("AddTodoItem");

        app.MapPut("/todos/{id:int}", (int id, TodoItem item, TodoService service) =>
        {
            var updated = service.Update(id, item);
            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("UpdateTodoItem");

        app.MapDelete("/todos/{id:int}", (int id, TodoService service) =>
        {
            var deleted = service.Delete(id);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteTodoItem");
    }
}
