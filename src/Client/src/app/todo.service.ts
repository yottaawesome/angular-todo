import { Injectable } from '@angular/core';
import { TodoItem } from './todoitem';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  BehaviorSubject,
  Observable,
  catchError,
  defer,
  map,
  tap,
  throwError,
} from 'rxjs';

export interface TodoState {
  items: TodoItem[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private stateSubject = new BehaviorSubject<TodoState>({
    items: [],
    isLoading: false,
    error: null,
  });

  private apiUrl = environment.apiUrl;
  private client: HttpClient;
  state$ = this.stateSubject.asObservable();

  constructor(http: HttpClient) {
    this.client = http;
    this.loadItems().subscribe({
      error: this.ignoreHandledError,
    });
  }

  private ignoreHandledError() {}

  private updateState(update: Partial<TodoState>) {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...update,
    });
  }

  private sortItems(items: TodoItem[]) {
    return [...items].sort(
      (left, right) => Number(right.isCompleted) - Number(left.isCompleted),
    );
  }

  private publishItems(items: TodoItem[]) {
    this.updateState({
      items: this.sortItems(items),
      isLoading: false,
      error: null,
    });
  }

  loadItems(): Observable<TodoItem[]> {
    this.updateState({ isLoading: true, error: null });

    return this.client.get<TodoItem[]>(this.apiUrl).pipe(
      tap((items) => {
        this.publishItems(items);
      }),
      catchError((error: unknown) => {
        this.updateState({
          isLoading: false,
          error: 'Could not load todos. Check that the server is running.',
        });
        return throwError(() => error);
      }),
    );
  }

  getItems(filter: "all" | "active" | "done"): Observable<TodoItem[]> {
    return this.state$.pipe(
      map((state) => {
        if (filter === "all") {
          return state.items;
        }

        return state.items.filter((item) =>
          filter === "done" ? item.isCompleted : !item.isCompleted,
        );
      }),
    );
  }

  deleteItem(id: number): Observable<void> {
    this.updateState({ error: null });

    return this.client.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.publishItems(
          this.stateSubject.value.items.filter((item) => item.id !== id),
        );
      }),
      catchError((error: unknown) => {
        this.updateState({
          error: 'Could not delete the todo. Please try again.',
        });
        return throwError(() => error);
      }),
    );
  }

  addItem(description: string): Observable<TodoItem> {
    this.updateState({ error: null });

    return this.client
      .post<TodoItem>(this.apiUrl, {
        title: description.trim(),
        isCompleted: false,
      })
      .pipe(
        tap((newItem) => {
          this.publishItems([newItem, ...this.stateSubject.value.items]);
        }),
        catchError((error: unknown) => {
          this.updateState({
            error: 'Could not add the todo. Please try again.',
          });
          return throwError(() => error);
        }),
      );
  }

  updateItem(item: TodoItem): Observable<void> {
    return defer(() => {
      const previousItems = this.stateSubject.value.items;

      this.updateState({ error: null });

      this.publishItems(
        previousItems.map((currentItem) =>
          currentItem.id === item.id ? item : currentItem,
        ),
      );

      return this.client.put<void>(`${this.apiUrl}/${item.id}`, item).pipe(
        catchError((error: unknown) => {
          this.updateState({
            items: this.sortItems(previousItems),
            error: 'Could not update the todo. Your change was not saved.',
          });
          return throwError(() => error);
        }),
      );
    });
  }
}
