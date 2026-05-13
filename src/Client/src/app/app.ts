import { Component, signal, inject } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { TodoService } from './todo.service';
import { TodoItem } from './todoitem';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = "My To Do List";

  private todoService = inject(TodoService);

  newItemDescription = signal("");

  pendingDeleteId = signal<number | null>(null);

  filter: "all" | "active" | "done" = "all";

  state$ = this.todoService.state$;

  items$ = this.todoService.getItems(this.filter);

  private ignoreHandledError() {}

  retryLoad() {
    this.todoService.loadItems().subscribe({
      error: this.ignoreHandledError,
    });
  }

  requestDelete(id: number) {
    this.pendingDeleteId.set(id);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
  }

  confirmDelete(id: number) {
    this.todoService.deleteItem(id).subscribe({
      next: () => {
        this.pendingDeleteId.set(null);
      },
      error: this.ignoreHandledError,
    });
  }

  addItem(description: string) {
    if (!description.trim()) return;

    this.todoService.addItem(description).subscribe({
      next: () => {
        this.newItemDescription.set("");
      },
      error: this.ignoreHandledError,
    });
  }

  updateItem(item: TodoItem, isCompleted: boolean) {
    this.todoService.updateItem({ ...item, isCompleted }).subscribe({
      error: this.ignoreHandledError,
    });
  }
}
