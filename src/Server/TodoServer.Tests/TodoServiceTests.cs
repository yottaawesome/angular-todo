using TodoServer.DataAccess;
using TodoServer.Services;
using TodoServer.Models;

namespace TodoServer.Tests;

public class TodoServiceTests
{
    [Fact]
    public void GetAll_WhenNoItemsExist_ReturnsEmpty()
    {
        var service = CreateService();

        var items = service.GetAll();

        Assert.Empty(items);
    }

    [Fact]
    public void Add_AssignsSequentialIdsAndStoresTodoItems()
    {
        var service = CreateService();
        var firstItem = new TodoItem { Title = "Write tests" };
        var secondItem = new TodoItem { Title = "Review tests", IsCompleted = true };

        service.Add(firstItem);
        service.Add(secondItem);

        var stored = service.GetAll().ToArray();
        Assert.Equal(2, stored.Length);
        Assert.Equal(1, stored[0].Id);
        Assert.Equal("Write tests", stored[0].Title);
        Assert.False(stored[0].IsCompleted);
        Assert.Equal(2, stored[1].Id);
        Assert.Equal("Review tests", stored[1].Title);
        Assert.True(stored[1].IsCompleted);
    }

    [Fact]
    public void Update_WhenItemExists_ReplacesTodoItem()
    {
        var service = CreateService();
        var item = new TodoItem { Title = "Original" };
        service.Add(item);
        var updatedItem = new TodoItem
        {
            Id = item.Id,
            Title = "Updated",
            IsCompleted = true
        };

        var updated = service.Update(item.Id, updatedItem);

        Assert.True(updated);
        var stored = Assert.Single(service.GetAll());
        Assert.Equal(item.Id, stored.Id);
        Assert.Equal("Updated", stored.Title);
        Assert.True(stored.IsCompleted);
    }

    [Fact]
    public void Update_WhenItemDoesNotExist_ReturnsFalseAndDoesNotAddItem()
    {
        var service = CreateService();
        var item = new TodoItem { Id = 999, Title = "Missing" };

        var updated = service.Update(item.Id, item);

        Assert.False(updated);
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Delete_WhenItemExists_RemovesTodoItem()
    {
        var service = CreateService();
        var item = new TodoItem { Title = "Delete me" };
        service.Add(item);

        var deleted = service.Delete(item.Id);

        Assert.True(deleted);
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Delete_WhenItemDoesNotExist_ReturnsFalse()
    {
        var service = CreateService();

        var deleted = service.Delete(999);

        Assert.False(deleted);
    }

    private static TodoService CreateService()
    {
        return new TodoService(new InMemoryTodoStore());
    }
}
