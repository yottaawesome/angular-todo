namespace TodoServer.DataAccess;
using TodoServer.Models;

public interface ITodoDataStore
{
    void Add(TodoItem item);
    bool Update(int id, TodoItem item);
    bool Delete(int id);
    IEnumerable<TodoItem> GetAll();
}
