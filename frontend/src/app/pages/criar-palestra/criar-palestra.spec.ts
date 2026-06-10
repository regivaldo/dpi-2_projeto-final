import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import {
  CreateTalkRequest,
  Talk,
  TalksService,
} from '../../core/talks/talks.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CriarPalestra } from './criar-palestra';

describe('CriarPalestra', () => {
  let fixture: ComponentFixture<CriarPalestra>;
  let createTalkResponse: Observable<Talk>;
  let lastCreateTalkRequest: CreateTalkRequest | null;
  let logoutSpy: jasmine.Spy;

  beforeEach(async () => {
    lastCreateTalkRequest = null;
    logoutSpy = jasmine.createSpy('logout');
    createTalkResponse = of({
      id: 'talk-1',
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
      speaker: {
        id: 'speaker-1',
        fullName: 'Maria Palestrante',
      },
    });

    await TestBed.configureTestingModule({
      imports: [CriarPalestra],
      providers: [
        provideRouter([]),
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
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CriarPalestra);
  });

  afterEach(() => {
    TestBed.inject(ToastService).dismiss();
  });

  it('should render the create talk form', () => {
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
    expect(compiled.querySelector('button')?.textContent).toContain(
      'Cadastrar palestra',
    );
  });

  it('should show an error toast when required fields are empty', () => {
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Os campos título, descrição, data e horário são de preenchimento obrigatório.',
    );
    expect(lastCreateTalkRequest).toBeNull();
  });

  it('should show an error toast when required fields have only spaces', () => {
    const toastService = TestBed.inject(ToastService);
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
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
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

  it('should omit folderUrl when it is empty', () => {
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

  it('should logout and navigate to login when backend returns unauthorized', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    createTalkResponse = throwError(() => new HttpErrorResponse({ status: 401 }));
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show a permission toast when backend returns forbidden', () => {
    const toastService = TestBed.inject(ToastService);
    createTalkResponse = throwError(() => new HttpErrorResponse({ status: 403 }));
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Apenas palestrantes podem cadastrar palestras.',
    );
  });

  it('should show a generic toast when creation fails', () => {
    const toastService = TestBed.inject(ToastService);
    createTalkResponse = throwError(() => new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'Não foi possível cadastrar a palestra. Tente novamente.',
    );
  });
});

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
