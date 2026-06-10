import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService, LoginRequest } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Login } from './login';

describe('Login', () => {
  let loginResponse: ReturnType<AuthService['login']>;
  let lastLoginRequest: LoginRequest | null;

  beforeEach(async () => {
    lastLoginRequest = null;
    loginResponse = of({
      accessToken: 'token',
      user: {
        id: '1',
        fullName: 'Usuario Teste',
        email: 'usuario@email.com',
        phone: '11999999999',
        title: 'Graduação',
        role: 'Usuário',
      },
    });

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            login: (request: LoginRequest) => {
              lastLoginRequest = request;
              return loginResponse;
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should render the login form', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Encontre, organize e acompanhe palestras',
    );
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
    expect(compiled.querySelector('button')?.textContent).toContain('Autenticar');
  });

  it('should show an error toast when email and password are empty', async () => {
    const fixture = TestBed.createComponent(Login);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    submitForm(fixture.nativeElement);
    fixture.detectChanges();

    expect(toastService.message()?.text).toBe(
      'Os campos e-mail e senha s\u00e3o de preenchimento obrigat\u00f3rio',
    );
    toastService.dismiss();
  });

  it('should show an error toast when email is empty', async () => {
    const fixture = TestBed.createComponent(Login);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    password.value = 'Senha@123';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    submitForm(fixture.nativeElement);
    fixture.detectChanges();

    expect(toastService.message()?.text).toBe(
      'O campo e-mail \u00e9 de preenchimento obrigat\u00f3rio',
    );
    toastService.dismiss();
  });

  it('should show an error toast when password is empty', async () => {
    const fixture = TestBed.createComponent(Login);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    email.value = 'usuario@email.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    submitForm(fixture.nativeElement);
    fixture.detectChanges();

    expect(toastService.message()?.text).toBe(
      'O campo senha \u00e9 de preenchimento obrigat\u00f3rio',
    );
    toastService.dismiss();
  });

  it('should call the backend authentication service with email and password', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[type="email"]', ' usuario@email.com ');
    fillInput(fixture.nativeElement, 'input[type="password"]', 'Senha@123');
    submitForm(fixture.nativeElement);

    expect(lastLoginRequest).toEqual({
      email: 'usuario@email.com',
      password: 'Senha@123',
    });
  });

  it('should show an invalid credentials toast when backend returns unauthorized', () => {
    loginResponse = throwError(() => new HttpErrorResponse({ status: 401 }));
    const fixture = TestBed.createComponent(Login);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[type="email"]', 'usuario@email.com');
    fillInput(fixture.nativeElement, 'input[type="password"]', 'Senha@123');
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe('E-mail ou senha inv\u00e1lidos.');
    toastService.dismiss();
  });
});

function submitForm(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function fillInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
