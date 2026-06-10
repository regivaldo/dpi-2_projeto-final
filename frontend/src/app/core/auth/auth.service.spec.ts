import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

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
      user: {
        id: '1',
        fullName: 'Usuario Teste',
        email: 'usuario@email.com',
        phone: '11999999999',
        title: 'Graduação',
        role: 'Usuário',
      },
    });
  });
});
