import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TodoService, TodoState } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TodoService);
    httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('https://localhost:7058/todos').flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should publish loaded items and filter active and done items', () => {
    const activeItem = { id: 1, title: 'Active', isCompleted: false };
    const doneItem = { id: 2, title: 'Done', isCompleted: true };
    let allItems: typeof activeItem[] = [];
    let activeItems: typeof activeItem[] = [];
    let doneItems: typeof activeItem[] = [];
    let latestState: TodoState | undefined;

    service.getItems('all').subscribe((items) => {
      allItems = items;
    });
    service.getItems('active').subscribe((items) => {
      activeItems = items;
    });
    service.getItems('done').subscribe((items) => {
      doneItems = items;
    });
    service.state$.subscribe((state) => {
      latestState = state;
    });

    service.loadItems().subscribe();

    expect(latestState?.isLoading).toBe(true);

    httpTesting
      .expectOne('https://localhost:7058/todos')
      .flush([activeItem, doneItem]);

    expect(latestState).toEqual({
      items: [doneItem, activeItem],
      isLoading: false,
      error: null,
    });
    expect(allItems).toEqual([doneItem, activeItem]);
    expect(activeItems).toEqual([activeItem]);
    expect(doneItems).toEqual([doneItem]);
  });

  it('should publish a load error when fetching items fails', () => {
    let latestState: TodoState | undefined;

    service.state$.subscribe((state) => {
      latestState = state;
    });

    service.loadItems().subscribe({
      error: () => undefined,
    });

    expect(latestState?.isLoading).toBe(true);

    httpTesting
      .expectOne('https://localhost:7058/todos')
      .flush('Server unavailable', {
        status: 0,
        statusText: 'Unknown Error',
      });

    expect(latestState).toEqual({
      items: [],
      isLoading: false,
      error: 'Could not load todos. Check that the server is running.',
    });
  });

  it('should trim item descriptions before creating todos', () => {
    const createdItem = { id: 1, title: 'Trimmed todo', isCompleted: false };

    service.addItem('  Trimmed todo  ').subscribe();

    const addRequest = httpTesting.expectOne('https://localhost:7058/todos');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({
      title: 'Trimmed todo',
      isCompleted: false,
    });

    addRequest.flush(createdItem);
  });

  it('should publish an add error and keep existing items when adding fails', () => {
    const existingItem = { id: 1, title: 'Existing', isCompleted: false };
    let latestState: TodoState | undefined;

    service.state$.subscribe((state) => {
      latestState = state;
    });

    service.addItem(existingItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(existingItem);

    service.addItem('New item').subscribe({
      error: () => undefined,
    });

    const addRequest = httpTesting.expectOne('https://localhost:7058/todos');
    expect(addRequest.request.method).toBe('POST');

    addRequest.flush('Server unavailable', {
      status: 0,
      statusText: 'Unknown Error',
    });

    expect(latestState).toEqual({
      items: [existingItem],
      isLoading: false,
      error: 'Could not add the todo. Please try again.',
    });
  });

  it('should update an item and publish the changed list', () => {
    const createdItem = { id: 1, title: 'Original', isCompleted: false };
    const secondItem = { id: 2, title: 'Second', isCompleted: false };
    const updatedItem = { ...createdItem, isCompleted: true };
    let latestItems: typeof createdItem[] = [];

    service.getItems('all').subscribe((items) => {
      latestItems = items;
    });

    service.addItem(createdItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(createdItem);
    service.addItem(secondItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(secondItem);

    service.updateItem(updatedItem).subscribe();
    const updateRequest = httpTesting.expectOne('https://localhost:7058/todos/1');

    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(updatedItem);
    expect(latestItems).toEqual([updatedItem, secondItem]);

    updateRequest.flush(null);

    expect(latestItems).toEqual([updatedItem, secondItem]);
  });

  it('should roll back optimistic updates and publish an error when updating fails', () => {
    const createdItem = { id: 1, title: 'Original', isCompleted: false };
    const updatedItem = { ...createdItem, isCompleted: true };
    let latestItems: typeof createdItem[] = [];
    let latestState: TodoState | undefined;

    service.getItems('all').subscribe((items) => {
      latestItems = items;
    });
    service.state$.subscribe((state) => {
      latestState = state;
    });

    service.addItem(createdItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(createdItem);

    service.updateItem(updatedItem).subscribe({
      error: () => undefined,
    });

    expect(latestItems).toEqual([updatedItem]);

    httpTesting.expectOne('https://localhost:7058/todos/1').flush('Server unavailable', {
      status: 0,
      statusText: 'Unknown Error',
    });

    expect(latestItems).toEqual([createdItem]);
    expect(latestState?.error).toBe('Could not update the todo. Your change was not saved.');
  });

  it('should delete an item and publish the changed list', () => {
    const firstItem = { id: 1, title: 'First', isCompleted: false };
    const secondItem = { id: 2, title: 'Second', isCompleted: false };
    let latestItems: typeof firstItem[] = [];

    service.getItems('all').subscribe((items) => {
      latestItems = items;
    });

    service.addItem(firstItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(firstItem);
    service.addItem(secondItem.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(secondItem);

    service.deleteItem(firstItem.id).subscribe();
    const deleteRequest = httpTesting.expectOne('https://localhost:7058/todos/1');

    expect(deleteRequest.request.method).toBe('DELETE');

    deleteRequest.flush(null);

    expect(latestItems).toEqual([secondItem]);
  });

  it('should publish a delete error and keep items when deleting fails', () => {
    const item = { id: 1, title: 'Keep me', isCompleted: false };
    let latestState: TodoState | undefined;

    service.state$.subscribe((state) => {
      latestState = state;
    });

    service.addItem(item.title).subscribe();
    httpTesting.expectOne('https://localhost:7058/todos').flush(item);

    service.deleteItem(item.id).subscribe({
      error: () => undefined,
    });

    httpTesting.expectOne('https://localhost:7058/todos/1').flush('Server unavailable', {
      status: 0,
      statusText: 'Unknown Error',
    });

    expect(latestState).toEqual({
      items: [item],
      isLoading: false,
      error: 'Could not delete the todo. Please try again.',
    });
  });
});
