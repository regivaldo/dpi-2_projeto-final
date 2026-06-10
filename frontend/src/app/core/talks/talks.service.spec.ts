import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { TalksService } from './talks.service';

describe('TalksService', () => {
  let service: TalksService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'token',
          },
        },
      ],
    });

    service = TestBed.inject(TalksService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should send the bearer token when listing talks', () => {
    service.listTalks().subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks?limit=100',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush({
      items: [],
      meta: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('should send the search term when provided', () => {
    service.listTalks(' nestjs ').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks?limit=100&search=nestjs',
    );

    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush({
      items: [],
      meta: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
