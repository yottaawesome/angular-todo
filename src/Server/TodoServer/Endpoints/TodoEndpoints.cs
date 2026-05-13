using TodoServer.Models;
using TodoServer.Services;

namespace TodoServer.Endpoints;

/// <summary>
/// Registers the todo REST API routes used by the Angular client.
/// </summary>
public static class TodoEndpoints
{
    /// <summary>
    /// Adds all todo item endpoints to the application route table.
    /// </summary>
    /// <remarks>
    /// The endpoints keep HTTP concerns here: route shape, input validation, and status codes.
    /// Todo storage and update behavior stays behind <see cref="TodoService"/>.
    /// </remarks>
    public static void MapTodoEndpoints(this WebApplication app)
    {
        // Returns a snapshot of the current todo list. The backing store decides ordering.
        app.MapGet("/todos", (TodoService service) =>
        {
            return service.GetAll();
        })
        .WithName("GetAllTodoItems")
        .WithSummary("List todo items")
        .WithDescription("Returns all todo items currently stored by the server.");

        // Creates a new todo item. The server owns id assignment even if the client sends an id.
        app.MapPost("/todos", (TodoItem item, TodoService service) =>
        {
            if (string.IsNullOrWhiteSpace(item.Title))
            {
                return Results.BadRequest("Title is required.");
            }

            var createdItem = service.Add(item);
            return Results.Created($"/todos/{createdItem.Id}", createdItem);
        })
        .WithName("AddTodoItem")
        .WithSummary("Create a todo item")
        .WithDescription("Creates a todo item with a required title and returns the server-assigned id.");

        // Replaces the editable fields for an existing todo item.
        // The route id is authoritative; the data store preserves the existing id.
        app.MapPut("/todos/{id:int}", (int id, TodoItem item, TodoService service) =>
        {
            if (string.IsNullOrWhiteSpace(item.Title))
            {
                return Results.BadRequest("Title is required.");
            }

            var updated = service.Update(id, item);
            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("UpdateTodoItem")
        .WithSummary("Update a todo item")
        .WithDescription("Updates an existing todo item by route id. Returns 404 when the item does not exist.");

        // Removes an existing todo item by id. Deleting a missing id is reported as 404.
        app.MapDelete("/todos/{id:int}", (int id, TodoService service) =>
        {
            var deleted = service.Delete(id);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteTodoItem")
        .WithSummary("Delete a todo item")
        .WithDescription("Deletes an existing todo item by id. Returns 404 when the item does not exist.");
    }
}
