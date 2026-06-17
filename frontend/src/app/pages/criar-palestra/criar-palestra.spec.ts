import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import {
  CreateTalkRequest,
  Talk,
  TalksService,
  UpdateTalkRequest,
} from '../../core/talks/talks.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CriarPalestra } from './criar-palestra';
import { vi } from 'vitest';

describe('CriarPalestra', () => {
  let createTalkResponse: Observable<Talk>;
  let getTalkResponse: Observable<Talk>;
  let updateTalkResponse: Observable<Talk>;
  let lastCreateTalkRequest: CreateTalkRequest | null;
  let lastUpdateTalkRequest: UpdateTalkRequest | null;
  let lastUpdateTalkId: string | null;
  let requestedTalkId: string | null;
  let logoutSpy: ReturnType<typeof vi.fn>;
  let routeId: string | null;
  let createObjectUrlSpy: ReturnType<typeof vi.fn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    routeId = null;
    lastCreateTalkRequest = null;
    lastUpdateTalkRequest = null;
    lastUpdateTalkId = null;
    requestedTalkId = null;
    logoutSpy = vi.fn();
    createObjectUrlSpy = vi.fn().mockReturnValue('blob:cover-preview');
    revokeObjectUrlSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlSpy,
    });
    createTalkResponse = of(createTalk());
    getTalkResponse = of(createTalk({ startTime: '19:30:00' }));
    updateTalkResponse = of(createTalk({ title: 'Angular atualizado' }));

    await TestBed.configureTestingModule({
      imports: [CriarPalestra],
      providers: [
        provideRouter([{ path: '**', component: CriarPalestra }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => routeId,
              },
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            logout: logoutSpy,
          },
        },
        {
          provide: TalksService,
          useValue: {
            createTalk: (request: CreateTalkRequest) => {
              lastCreateTalkRequest = request;
              return createTalkResponse;
            },
            getTalk: (id: string) => {
              requestedTalkId = id;
              return getTalkResponse;
            },
            updateTalk: (id: string, request: UpdateTalkRequest) => {
              lastUpdateTalkId = id;
              lastUpdateTalkRequest = request;
              return updateTalkResponse;
            },
            resolveCoverImageUrl: (coverImageUrl?: string | null) =>
              coverImageUrl ? `http://localhost:3000${coverImageUrl}` : null,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(ToastService).dismiss();
  });

  it('should render the create talk form', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Criar Palestra');
    expect(compiled.querySelector('input[formControlName="title"]')).toBeTruthy();
    expect(
      compiled.querySelector('textarea[formControlName="description"]'),
    ).toBeTruthy();
    expect(compiled.querySelector('input[type="date"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="time"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="url"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="file"]')).toBeTruthy();
    expect(compiled.querySelector('.cover-preview')).toBeTruthy();
    expect(compiled.querySelector('button')?.textContent).toContain(
      'Cadastrar palestra',
    );
  });

  it('should show an error toast when required fields are empty', () => {
    const toastService = TestBed.inject(ToastService);
    const fixture = createFixture();
    fixture.detectChanges();

    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Os campos título, descrição, data e horário são de preenchimento obrigatório.',
    );
    expect(lastCreateTalkRequest).toBeNull();
  });

  it('should show an error toast when required fields have only spaces', () => {
    const toastService = TestBed.inject(ToastService);
    const fixture = createFixture();
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[formControlName="title"]', '   ');
    fillTextarea(
      fixture.nativeElement,
      'textarea[formControlName="description"]',
      '   ',
    );
    fillInput(fixture.nativeElement, 'input[type="date"]', '2026-06-15');
    fillInput(fixture.nativeElement, 'input[type="time"]', '19:30');
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Os campos título e descrição são de preenchimento obrigatório.',
    );
    expect(lastCreateTalkRequest).toBeNull();
  });

  it('should show an error toast when folder URL is invalid', () => {
    const toastService = TestBed.inject(ToastService);
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    fillInput(fixture.nativeElement, 'input[formControlName="folderUrl"]', 'site');
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Informe uma URL válida começando com http:// ou https://.',
    );
    expect(lastCreateTalkRequest).toBeNull();
  });

  it('should create a talk with trimmed values, show success and navigate to mine', () => {
    const router = TestBed.inject(Router);
    const toastService = TestBed.inject(ToastService);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(lastCreateTalkRequest).toEqual({
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
      folderUrl: 'https://example.com/palestra',
    });
    expect(toastService.message()).toEqual({
      text: 'Palestra cadastrada com sucesso.',
      type: 'success',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/palestras/minhas']);
  });

  it('should include a selected cover image when creating a talk', () => {
    const coverImage = new File(['cover'], 'capa.png', { type: 'image/png' });
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    selectCoverImage(fixture.nativeElement, coverImage);
    submitForm(fixture.nativeElement);

    expect(lastCreateTalkRequest?.coverImage).toBe(coverImage);
    expect(createObjectUrlSpy).toHaveBeenCalledWith(coverImage);
  });

  it('should reject invalid cover image type', () => {
    const toastService = TestBed.inject(ToastService);
    const invalidCover = new File(['cover'], 'capa.gif', { type: 'image/gif' });
    const fixture = createFixture();
    fixture.detectChanges();

    selectCoverImage(fixture.nativeElement, invalidCover);

    expect(toastService.message()?.text).toBe(
      'A capa deve ser uma imagem PNG ou JPG.',
    );
    expect(createObjectUrlSpy).not.toHaveBeenCalled();
  });

  it('should reject cover image larger than 5 MB', () => {
    const toastService = TestBed.inject(ToastService);
    const largeCover = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'capa.jpg', {
      type: 'image/jpeg',
    });
    const fixture = createFixture();
    fixture.detectChanges();

    selectCoverImage(fixture.nativeElement, largeCover);

    expect(toastService.message()?.text).toBe('A capa deve ter no máximo 5 MB.');
    expect(createObjectUrlSpy).not.toHaveBeenCalled();
  });

  it('should omit folderUrl when it is empty on create', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    fillInput(fixture.nativeElement, 'input[formControlName="folderUrl"]', '   ');
    submitForm(fixture.nativeElement);

    expect(lastCreateTalkRequest).toEqual({
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
    });
  });

  it('should load and render the edit talk form', () => {
    routeId = 'talk-1';
    const fixture = createFixture();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(requestedTalkId).toBe('talk-1');
    expect(compiled.textContent).not.toContain('Carregando dados da palestra...');
    expect(compiled.querySelector('h1')?.textContent).toContain('Editar Palestra');
    expect((compiled.querySelector('input[formControlName="title"]') as HTMLInputElement).value).toBe('Angular moderno');
    expect((compiled.querySelector('input[type="time"]') as HTMLInputElement).value).toBe('19:30');
    expect(compiled.querySelector('button')?.textContent).toContain(
      'Salvar alterações',
    );
  });

  it('should update a talk with trimmed values and nullable folderUrl', () => {
    routeId = 'talk-1';
    const router = TestBed.inject(Router);
    const toastService = TestBed.inject(ToastService);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = createFixture();
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[formControlName="title"]', ' Angular atualizado ');
    fillTextarea(
      fixture.nativeElement,
      'textarea[formControlName="description"]',
      ' Descrição atualizada. ',
    );
    fillInput(fixture.nativeElement, 'input[type="date"]', '2026-06-20');
    fillInput(fixture.nativeElement, 'input[type="time"]', '20:00');
    fillInput(fixture.nativeElement, 'input[formControlName="folderUrl"]', '   ');
    submitForm(fixture.nativeElement);

    expect(lastUpdateTalkId).toBe('talk-1');
    expect(lastUpdateTalkRequest).toEqual({
      title: 'Angular atualizado',
      description: 'Descrição atualizada.',
      date: '2026-06-20',
      startTime: '20:00',
      folderUrl: null,
      coverImage: null,
    });
    expect(toastService.message()).toEqual({
      text: 'Palestra atualizada com sucesso.',
      type: 'success',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/palestras/minhas']);
  });

  it('should logout and navigate to login when backend returns unauthorized on create', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    createTalkResponse = throwError(() => new HttpErrorResponse({ status: 401 }));
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show a permission toast when backend returns forbidden on update', () => {
    routeId = 'talk-1';
    const toastService = TestBed.inject(ToastService);
    updateTalkResponse = throwError(() => new HttpErrorResponse({ status: 403 }));
    const fixture = createFixture();
    fixture.detectChanges();

    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe('Você não pode editar esta palestra.');
  });

  it('should show a not found toast when edit loading returns not found', () => {
    routeId = 'talk-1';
    const router = TestBed.inject(Router);
    const toastService = TestBed.inject(ToastService);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    getTalkResponse = throwError(() => new HttpErrorResponse({ status: 404 }));
    const fixture = createFixture();

    fixture.detectChanges();

    expect(toastService.message()?.text).toBe('Palestra não encontrada.');
    expect(navigateSpy).toHaveBeenCalledWith(['/palestras/minhas']);
  });

  it('should show a generic toast when creation fails', () => {
    const toastService = TestBed.inject(ToastService);
    createTalkResponse = throwError(() => new HttpErrorResponse({ status: 500 }));
    const fixture = createFixture();
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Não foi possível cadastrar a palestra. Tente novamente.',
    );
  });
});

function createFixture(): ComponentFixture<CriarPalestra> {
  return TestBed.createComponent(CriarPalestra);
}

function createTalk(overrides: Partial<Talk> = {}): Talk {
  return {
    id: 'talk-1',
    title: 'Angular moderno',
    description: 'Palestra sobre Angular standalone.',
    date: '2026-06-15',
    startTime: '19:30',
    folderUrl: 'https://example.com/palestra',
    coverImageUrl: null,
    speaker: {
      id: 'speaker-1',
      fullName: 'Maria Palestrante',
    },
    attendees: [],
    ...overrides,
  };
}

function submitForm(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function fillValidForm(element: HTMLElement): void {
  fillInput(element, 'input[formControlName="title"]', ' Angular moderno ');
  fillTextarea(
    element,
    'textarea[formControlName="description"]',
    ' Palestra sobre Angular standalone. ',
  );
  fillInput(element, 'input[type="date"]', '2026-06-15');
  fillInput(element, 'input[type="time"]', '19:30');
  fillInput(
    element,
    'input[formControlName="folderUrl"]',
    ' https://example.com/palestra ',
  );
}

function fillInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillTextarea(element: HTMLElement, selector: string, value: string): void {
  const textarea = element.querySelector(selector) as HTMLTextAreaElement;
  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectCoverImage(element: HTMLElement, file: File): void {
  const input = element.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
