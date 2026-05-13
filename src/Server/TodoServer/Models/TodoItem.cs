namespace TodoServer.Models;

public record TodoItem
{
    public int Id { get; set; } = 0;
    public string Title { get; init; } = string.Empty;
    public bool IsCompleted { get; init; }
};
