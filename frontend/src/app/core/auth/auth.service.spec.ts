import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthenticatedUser, AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  const user: AuthenticatedUser = {
    id: '1',
    fullName: 'Usuário Teste',
    email: 'usuario@email.com',
    phone: '11999999999',
    title: 'Graduação',
    role: 'Usuário',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should authenticate against the backend and store the session', () => {
    service
      .login({ email: 'usuario@email.com', password: 'Senha@123' })
      .subscribe((response) => {
        expect(response.accessToken).toBe('token');
        expect(service.getToken()).toBe('token');
        expect(service.getCurrentUser()).toEqual(user);
        expect(service.isAuthenticated()).toBe(true);
      });

    const request = httpTestingController.expectOne(
      'http://localhost:3000/auth/login',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'usuario@email.com',
      password: 'Senha@123',
    });

    request.flush({
      accessToken: 'token',
      user,
    });
  });

  it('should accept alternate token property names from the backend', () => {
    service
      .login({ email: 'usuario@email.com', password: 'Senha@123' })
      .subscribe(() => {
        expect(service.getToken()).toBe('token-alternativo');
        expect(service.isAuthenticated()).toBe(true);
      });

    const request = httpTestingController.expectOne(
      'http://localhost:3000/auth/login',
    );

    request.flush({
      token: 'token-alternativo',
      user,
    });
  });

  it('should ignore invalid stored token values', () => {
    localStorage.setItem('ifsp-palestra-token', 'undefined');
    localStorage.setItem('ifsp-palestra-user', JSON.stringify(user));

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should register against the backend without storing a session', () => {
    service
      .register({
        fullName: 'Usuário Teste',
        birthDate: '2000-01-15',
        email: 'usuario@email.com',
        password: 'Senha@123',
        phone: '11999999999',
        title: 'Graduação',
        role: 'Usuário',
      })
      .subscribe((response) => {
        expect(response.accessToken).toBe('token');
        expect(service.getToken()).toBeNull();
        expect(service.getCurrentUser()).toBeNull();
      });

    const request = httpTestingController.expectOne(
      'http://localhost:3000/auth/register',
    );
    expect(request.request.method).toBe('POST');

    request.flush({
      accessToken: 'token',
      user,
    });
  });

  it('should clear the stored session on logout', () => {
    localStorage.setItem('ifsp-palestra-token', 'token');
    localStorage.setItem('ifsp-palestra-user', JSON.stringify(user));

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
