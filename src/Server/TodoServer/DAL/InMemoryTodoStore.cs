namespace TodoServer.DataAccess;
using TodoServer.Models;

public class InMemoryTodoStore : ITodoDataStore
{
    // Overkill for this simple app, but you would need a mechanism
    // like this to make the store thread safe in a real app to
    // prevent concurrent access issues.
    private readonly object _lock = new();
    private int _nextId = 1;
    private List<TodoItem> _items { get; } = new();

    public TodoItem Add(TodoItem item)
    {
        lock (_lock)
        {
            item.Id = _nextId++;
            _items.Add(item);
            return item;
        }
    }

    public bool Update(int id, TodoItem item)
    {
        lock (_lock)
        {
            var index = _items.FindIndex(i => i.Id == id);
            if (index != -1)
            {
                // Make sure the id of the item being updated doesn't change.
                item.Id = _items[index].Id;
                _items[index] = item;
                return true;
            }
            return false;
        }
    }

    public bool Delete(int id)
    {
        lock (_lock)
        {
            var index = _items.FindIndex(i => i.Id == id);
            if (index != -1)
            {
                _items.RemoveAt(index);
                return true;
            }
            return false;
        }

    }

    public IEnumerable<TodoItem> GetAll()
    {
        lock(_lock)
        {
            return _items.ToArray();
        }
    }
}
