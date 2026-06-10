import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  birthDate: string;
  email: string;
  password: string;
  phone: string;
  title: string;
  role: string;
}

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  role: string;
}

export interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user: AuthenticatedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';
  private readonly tokenKey = 'ifsp-palestra-token';
  private readonly userKey = 'ifsp-palestra-user';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, data);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);

    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }

    return token;
  }

  getCurrentUser(): AuthenticatedUser | null {
    const storedUser = localStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthenticatedUser;
    } catch {
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private saveSession(response: LoginResponse): void {
    const token = this.extractToken(response);

    if (!token) {
      this.logout();
      throw new Error('Token de autenticação não foi retornado pela API.');
    }

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
  }

  private extractToken(response: LoginResponse): string {
    return response.accessToken ?? response.access_token ?? response.token ?? '';
  }
}
