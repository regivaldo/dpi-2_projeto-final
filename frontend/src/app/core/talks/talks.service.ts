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

@Injectable({ providedIn: 'root' })
export class TalksService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000';

  listTalks(search = ''): Observable<TalksResponse> {
    let params = new HttpParams().set('limit', 100);
    let headers = new HttpHeaders();
    const normalizedSearch = search.trim();
    const token = this.authService.getToken();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<TalksResponse>(`${this.apiUrl}/talks`, {
      headers,
      params,
    });
  }
}
