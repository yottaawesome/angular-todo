namespace TodoServer.Services;

using TodoServer.DataAccess;
using TodoServer.Models;

// This is mainly pass through because this app is simple.
// In a more complex app, this would contain business logic.
public class TodoService
{
    private readonly ITodoDataStore _database;
    public TodoService(ITodoDataStore database)
    {
        _database = database;
    }

    public void Add(TodoItem item)
    {
        _database.Add(item);
    }

    public bool Update(int id, TodoItem item)
    {
        return _database.Update(id, item);
    }

    public bool Delete(int id)
    {
        return _database.Delete(id);
    }

    public IEnumerable<TodoItem> GetAll()
    {
        return _database.GetAll();
    }
}
