import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { CreateTalkRequest, TalksService } from './talks.service';

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

  it('should create a talk with the bearer token', () => {
    const payload: CreateTalkRequest = {
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
      folderUrl: 'https://example.com/palestra',
    };

    service.createTalk(payload).subscribe();

    const request = httpTestingController.expectOne('http://localhost:3000/talks');

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.request.body).toEqual(payload);

    request.flush({
      id: 'talk-1',
      ...payload,
      speaker: {
        id: 'speaker-1',
        fullName: 'Maria Palestrante',
      },
    });
  });
});
