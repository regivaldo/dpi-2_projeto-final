import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Talk, TalksResponse, TalksService } from '../../core/talks/talks.service';
import { ToastService } from '../../shared/toast/toast.service';
import { MinhasPalestras } from './minhas-palestras';
import { vi } from 'vitest';

describe('MinhasPalestras', () => {
  let fixture: ComponentFixture<MinhasPalestras>;
  let listMyTalksResponse: Observable<TalksResponse>;
  let deleteTalkResponse: Observable<{ message: string }>;
  let lastSearch: string | null;
  let lastDeletedTalkId: string | null;
  let logoutSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    lastSearch = null;
    lastDeletedTalkId = null;
    logoutSpy = vi.fn();
    listMyTalksResponse = of(createTalksResponse([createTalk()]));
    deleteTalkResponse = of({ message: 'Palestra deletada com sucesso.' });

    await TestBed.configureTestingModule({
      imports: [MinhasPalestras],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({
              id: 'speaker-1',
              fullName: 'Maria Palestrante',
              email: 'maria@email.com',
              phone: '11999999999',
              title: 'Mestrado',
              role: 'Palestrante',
            }),
            logout: logoutSpy,
          },
        },
        {
          provide: TalksService,
          useValue: {
            listMyTalks: (search = '') => {
              lastSearch = search;
              return listMyTalksResponse;
            },
            deleteTalk: (id: string) => {
              lastDeletedTalkId = id;
              return deleteTalkResponse;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasPalestras);
  });

  afterEach(() => {
    TestBed.inject(ToastService).dismiss();
  });

  it('should render the page heading, search and create action', async () => {
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Minhas Palestras');
    expect(compiled.querySelector('input[type="search"]')).toBeTruthy();
    expect(compiled.querySelector('.primary-action')?.textContent).toContain(
      'Criar palestra',
    );
  });

  it('should load and render my talks with edit and delete actions', async () => {
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(lastSearch).toBe('');
    expect(compiled.textContent).toContain('Angular moderno');
    expect(compiled.textContent).toContain('Palestra sobre Angular standalone.');
    expect(compiled.textContent).toContain('15/06/2026');
    expect(compiled.textContent).toContain('19:30');
    expect(compiled.querySelector('.material-link')?.getAttribute('href')).toBe(
      'https://example.com/palestra',
    );
    expect(compiled.querySelector('.edit-action')?.textContent).toContain('Editar');
    expect(compiled.querySelector('.edit-action')?.getAttribute('href')).toBe(
      '/palestras/editar/talk-1',
    );
    expect(compiled.querySelector('.delete-action')?.textContent).toContain(
      'Deletar',
    );
  });

  it('should show the empty state when there are no talks', async () => {
    listMyTalksResponse = of(createTalksResponse([]));

    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Você ainda não cadastrou nenhuma palestra.',
    );
  });

  it('should search my talks with the informed term', async () => {
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[type="search"]', ' angular ');
    await waitForDebounce();

    expect(lastSearch).toBe(' angular ');
  });

  it('should open and close the delete confirmation modal', async () => {
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    click(fixture.nativeElement, '.delete-action');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Tem certeza que deseja deletar a palestra Angular moderno?',
    );

    click(fixture.nativeElement, '.modal-actions .secondary-action');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Esta ação não poderá ser desfeita.',
    );
    expect(lastDeletedTalkId).toBeNull();
  });

  it('should delete a talk after confirmation', async () => {
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    click(fixture.nativeElement, '.delete-action');
    fixture.detectChanges();
    click(fixture.nativeElement, '.danger-action');
    fixture.detectChanges();

    expect(lastDeletedTalkId).toBe('talk-1');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Angular moderno',
    );
    expect(toastService.message()).toEqual({
      text: 'Palestra deletada com sucesso.',
      type: 'success',
    });
  });

  it('should show a delete error toast when deletion fails', async () => {
    const toastService = TestBed.inject(ToastService);
    deleteTalkResponse = throwError(() => new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    click(fixture.nativeElement, '.delete-action');
    fixture.detectChanges();
    click(fixture.nativeElement, '.danger-action');

    expect(lastDeletedTalkId).toBe('talk-1');
    expect(toastService.message()?.text).toBe(
      'Não foi possível deletar a palestra. Tente novamente.',
    );
  });

  it('should logout and navigate to login when backend returns unauthorized', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 401 }));

    fixture.detectChanges();
    await waitForDebounce();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show a permission message when backend returns forbidden', async () => {
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 403 }));

    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Apenas palestrantes podem acessar esta listagem.',
    );
  });

  it('should show a generic error message when loading fails', async () => {
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 500 }));

    fixture.detectChanges();
    await waitForDebounce();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não foi possível carregar suas palestras. Tente novamente.',
    );
  });
});

function createTalk(overrides: Partial<Talk> = {}): Talk {
  return {
    id: 'talk-1',
    title: 'Angular moderno',
    description: 'Palestra sobre Angular standalone.',
    date: '2026-06-15',
    startTime: '19:30:00',
    folderUrl: 'https://example.com/palestra',
    speaker: {
      id: 'speaker-1',
      fullName: 'Maria Palestrante',
    },
    ...overrides,
  };
}

function createTalksResponse(items: Talk[]): TalksResponse {
  return {
    items,
    meta: {
      page: 1,
      limit: 100,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  };
}

function fillInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function click(element: HTMLElement, selector: string): void {
  (element.querySelector(selector) as HTMLElement).click();
}


function waitForDebounce(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 300));
}
