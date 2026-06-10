import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface TalkSpeaker {
  id: string;
  fullName: string;
}

export interface Talk {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  folderUrl?: string;
  speaker: TalkSpeaker;
}

export interface TalksResponse {
  items: Talk[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTalkRequest {
  title: string;
  description: string;
  date: string;
  startTime: string;
  folderUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TalksService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000';

  listTalks(search = ''): Observable<TalksResponse> {
    return this.listTalksFromEndpoint(`${this.apiUrl}/talks`, search);
  }

  listMyTalks(search = ''): Observable<TalksResponse> {
    return this.listTalksFromEndpoint(`${this.apiUrl}/talks/mine`, search);
  }

  createTalk(data: CreateTalkRequest): Observable<Talk> {
    return this.http.post<Talk>(`${this.apiUrl}/talks`, data, {
      headers: this.buildAuthHeaders(),
    });
  }

  private listTalksFromEndpoint(
    endpoint: string,
    search: string,
  ): Observable<TalksResponse> {
    let params = new HttpParams().set('limit', 100);
    const headers = this.buildAuthHeaders();
    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    return this.http.get<TalksResponse>(endpoint, {
      headers,
      params,
    });
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
