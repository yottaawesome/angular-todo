import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { App } from './app';
import { TodoService, TodoState } from './todo.service';

describe('App', () => {
  let stateSubject: BehaviorSubject<TodoState>;
  let loadItems: ReturnType<typeof vi.fn>;
  let deleteItem: ReturnType<typeof vi.fn>;
  let addItem: ReturnType<typeof vi.fn>;
  let updateItem: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    stateSubject = new BehaviorSubject<TodoState>({
      items: [{ id: 1, title: 'Test todo', isCompleted: false }],
      isLoading: false,
      error: null,
    });
    loadItems = vi.fn(() => of([]));
    deleteItem = vi.fn(() => of(undefined));
    addItem = vi.fn(() => of({ id: 2, title: 'New todo', isCompleted: false }));
    updateItem = vi.fn(() => of(undefined));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: TodoService,
          useValue: {
            getItems: () => of([{ id: 1, title: 'Test todo', isCompleted: false }]),
            state$: stateSubject.asObservable(),
            loadItems,
            deleteItem,
            addItem,
            updateItem,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('My To Do List');
  });

  it('should render errors and retry loading', async () => {
    stateSubject.next({
      items: [],
      isLoading: false,
      error: 'Could not load todos. Check that the server is running.',
    });
    const fixture = TestBed.createComponent(App);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not load todos. Check that the server is running.',
    );

    const retryButton = compiled.querySelector('.error-alert button') as HTMLButtonElement;
    retryButton.click();

    expect(loadItems).toHaveBeenCalledOnce();
  });

  it('should disable adding while todos are loading', async () => {
    stateSubject.next({
      items: [{ id: 1, title: 'Test todo', isCompleted: false }],
      isLoading: true,
      error: null,
    });
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.newItemDescription.set('New todo');

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('Loading todos...');
  });

  it('should not add blank todos', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.addItem('   ');

    expect(addItem).not.toHaveBeenCalled();
  });

  it('should clear the input only after adding succeeds', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.newItemDescription.set('New todo');

    app.addItem('New todo');

    expect(addItem).toHaveBeenCalledWith('New todo');
    expect(app.newItemDescription()).toBe('');
  });

  it('should keep the input when adding fails', () => {
    addItem.mockReturnValueOnce(throwError(() => new Error('Server unavailable')));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.newItemDescription.set('Retry me');

    app.addItem('Retry me');

    expect(addItem).toHaveBeenCalledWith('Retry me');
    expect(app.newItemDescription()).toBe('Retry me');
  });

  it('should update todo completion from the checkbox', async () => {
    const fixture = TestBed.createComponent(App);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkbox = compiled.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(updateItem).toHaveBeenCalledOnce();
    expect(updateItem).toHaveBeenCalledWith({
      id: 1,
      title: 'Test todo',
      isCompleted: true,
    });
  });

  it('should ask for confirmation before deleting an item', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const deleteButton = compiled.querySelector('[aria-label="Delete Test todo"]') as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    expect(deleteItem).not.toHaveBeenCalled();
    expect(compiled.querySelector('[aria-label="Confirm delete Test todo"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Cancel deleting Test todo"]')).not.toBeNull();
  });

  it('should cancel a pending delete', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('[aria-label="Delete Test todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (compiled.querySelector('[aria-label="Cancel deleting Test todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(deleteItem).not.toHaveBeenCalled();
    expect(compiled.querySelector('[aria-label="Delete Test todo"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Confirm delete Test todo"]')).toBeNull();
  });

  it('should delete an item after confirmation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('[aria-label="Delete Test todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (compiled.querySelector('[aria-label="Confirm delete Test todo"]') as HTMLButtonElement).click();

    expect(deleteItem).toHaveBeenCalledOnce();
    expect(deleteItem).toHaveBeenCalledWith(1);
  });
});
