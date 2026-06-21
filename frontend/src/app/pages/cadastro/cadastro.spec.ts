import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService, RegisterRequest } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Cadastro } from './cadastro';

describe('Cadastro', () => {
  let registerResponse: ReturnType<AuthService['register']>;
  let lastRegisterRequest: RegisterRequest | null;

  beforeEach(async () => {
    lastRegisterRequest = null;
    registerResponse = of({
      accessToken: 'token',
      user: {
        id: '1',
        fullName: 'Usuário Teste',
        email: 'usuario@email.com',
        phone: '11999999999',
        title: 'Graduação',
        role: 'Usuário',
      },
    });

    await TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            register: (request: RegisterRequest) => {
              lastRegisterRequest = request;
              return registerResponse;
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should render the registration form', async () => {
    const fixture = TestBed.createComponent(Cadastro);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Encontre, organize e acompanhe palestras',
    );
    expect(compiled.querySelector('input[formControlName="fullName"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="date"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(
      compiled.querySelector('input[formControlName="confirmPassword"]'),
    ).toBeTruthy();
    expect(compiled.querySelectorAll('select')).toHaveLength(2);
    expect(compiled.querySelector('button')?.textContent).toContain('Cadastrar');
  });

  it('should show an error toast when all fields are empty', () => {
    const fixture = TestBed.createComponent(Cadastro);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    submitForm(fixture.nativeElement);
    fixture.detectChanges();

    expect(toastService.message()?.text).toBe(
      'Os campos nome completo, data de nascimento, e-mail, senha, confirmação de senha, telefone, título e perfil são de preenchimento obrigatório',
    );
    toastService.dismiss();
  });

  it('should show a validation toast when password is weak', () => {
    const fixture = TestBed.createComponent(Cadastro);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    fillInput(fixture.nativeElement, 'input[formControlName="password"]', 'senha123');
    fillInput(
      fixture.nativeElement,
      'input[formControlName="confirmPassword"]',
      'senha123',
    );
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.',
    );
    expect(lastRegisterRequest).toBeNull();
    toastService.dismiss();
  });

  it('should show a validation toast when passwords do not match', () => {
    const fixture = TestBed.createComponent(Cadastro);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    fillInput(
      fixture.nativeElement,
      'input[formControlName="confirmPassword"]',
      'Outra@123',
    );
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe(
      'A senha e a confirmação de senha devem ser iguais.',
    );
    expect(lastRegisterRequest).toBeNull();
    toastService.dismiss();
  });

  it('should call the backend registration service with trimmed values', () => {
    const fixture = TestBed.createComponent(Cadastro);
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(lastRegisterRequest).toEqual({
      fullName: 'Usuário Teste',
      birthDate: '2000-01-15',
      email: 'usuario@email.com',
      password: 'Senha@123',
      phone: '11999999999',
      title: 'Graduação',
      role: 'Usuário',
    });
  });

  it('should hide the form and show a login action when registration succeeds', () => {
    const fixture = TestBed.createComponent(Cadastro);
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeFalsy();
    expect(compiled.textContent).toContain('Cadastro realizado com sucesso.');
    expect(compiled.querySelector('.success-action')?.getAttribute('href')).toBe(
      '/login',
    );
  });

  it('should show an already registered email toast when backend returns conflict', () => {
    registerResponse = throwError(() => new HttpErrorResponse({ status: 409 }));
    const fixture = TestBed.createComponent(Cadastro);
    const toastService = TestBed.inject(ToastService);
    fixture.detectChanges();

    fillValidForm(fixture.nativeElement);
    submitForm(fixture.nativeElement);

    expect(toastService.message()?.text).toBe('E-mail já cadastrado.');
    toastService.dismiss();
  });
});

function submitForm(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function fillValidForm(element: HTMLElement): void {
  fillInput(element, 'input[formControlName="fullName"]', ' Usuário Teste ');
  fillInput(element, 'input[type="date"]', '2000-01-15');
  fillInput(element, 'input[type="tel"]', ' 11999999999 ');
  fillInput(element, 'input[type="email"]', ' usuario@email.com ');
  fillInput(element, 'input[formControlName="password"]', 'Senha@123');
  fillInput(element, 'input[formControlName="confirmPassword"]', 'Senha@123');
  fillSelect(element, 'select[formControlName="title"]', 'Graduação');
  fillSelect(element, 'select[formControlName="role"]', 'Usuário');
}

function fillInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillSelect(element: HTMLElement, selector: string, value: string): void {
  const select = element.querySelector(selector) as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}
