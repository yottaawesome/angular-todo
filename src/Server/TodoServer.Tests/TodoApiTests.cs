using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using TodoServer.Models;

namespace TodoServer.Tests;

public class TodoApiTests
{
    [Fact]
    public async Task GetAll_WhenNoTodosExist_ReturnsEmptyArray()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/todos");

        response.EnsureSuccessStatusCode();
        var todos = await response.Content.ReadFromJsonAsync<TodoItem[]>();
        Assert.NotNull(todos);
        Assert.Empty(todos);
    }

    [Fact]
    public async Task Add_CreatesTodoItem()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);
        var item = new TodoItem
        {
            Title = $"API test {Guid.NewGuid()}",
            IsCompleted = false
        };

        var response = await client.PostAsJsonAsync("/todos", item);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<TodoItem>();
        Assert.NotNull(created);
        Assert.Equal(1, created.Id);
        Assert.Equal("/todos/1", response.Headers.Location?.OriginalString);
        Assert.Equal(item.Title, created.Title);
        Assert.False(created.IsCompleted);
    }

    [Fact]
    public async Task GetAll_WhenTodosExist_ReturnsTodoItems()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);
        var created = await AddTodoAsync(client, "Get all test");

        var response = await client.GetAsync("/todos");

        response.EnsureSuccessStatusCode();
        var todos = await response.Content.ReadFromJsonAsync<TodoItem[]>();
        Assert.NotNull(todos);
        var todo = Assert.Single(todos);
        Assert.Equal(created.Id, todo.Id);
        Assert.Equal(created.Title, todo.Title);
        Assert.Equal(created.IsCompleted, todo.IsCompleted);
    }

    [Fact]
    public async Task Update_WhenTodoExists_ReturnsNoContentAndUpdatesTodoItem()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);
        var created = await AddTodoAsync(client, "Original");
        var updatedItem = new TodoItem
        {
            Id = created.Id,
            Title = "Updated",
            IsCompleted = true
        };

        var updateResponse = await client.PutAsJsonAsync($"/todos/{created.Id}", updatedItem);

        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);
        var todos = await client.GetFromJsonAsync<TodoItem[]>("/todos");
        Assert.NotNull(todos);
        var stored = Assert.Single(todos);
        Assert.Equal(created.Id, stored.Id);
        Assert.Equal("Updated", stored.Title);
        Assert.True(stored.IsCompleted);
    }

    [Fact]
    public async Task Update_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);
        var item = new TodoItem { Id = 999, Title = "Missing" };

        var response = await client.PutAsJsonAsync($"/todos/{item.Id}", item);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_WhenTodoExists_ReturnsNoContentAndRemovesTodoItem()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);
        var created = await AddTodoAsync(client, "Delete me");

        var deleteResponse = await client.DeleteAsync($"/todos/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var todos = await client.GetFromJsonAsync<TodoItem[]>("/todos");
        Assert.NotNull(todos);
        Assert.Empty(todos);
    }

    [Fact]
    public async Task Delete_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = CreateClient(factory);

        var response = await client.DeleteAsync("/todos/-1");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static HttpClient CreateClient(WebApplicationFactory<Program> factory)
    {
        return factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
    }

    private static async Task<TodoItem> AddTodoAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/todos", new TodoItem { Title = title });
        response.EnsureSuccessStatusCode();
        var todo = await response.Content.ReadFromJsonAsync<TodoItem>();

        Assert.NotNull(todo);
        return todo;
    }
}
