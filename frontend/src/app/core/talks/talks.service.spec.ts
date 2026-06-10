import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import {
  CreateTalkRequest,
  TalksService,
  UpdateTalkRequest,
} from './talks.service';

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

    request.flush(createTalksResponse([]));
  });

  it('should send the search term when provided', () => {
    service.listTalks(' nestjs ').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks?limit=100&search=nestjs',
    );

    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush(createTalksResponse([]));
  });

  it('should send the bearer token when listing my talks', () => {
    service.listMyTalks().subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/mine?limit=100',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush(createTalksResponse([]));
  });

  it('should send the search term when listing my talks', () => {
    service.listMyTalks(' angular ').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/mine?limit=100&search=angular',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush(createTalksResponse([]));
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

    request.flush(createTalk(payload));
  });

  it('should get a talk by id with the bearer token', () => {
    service.getTalk('talk-1').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/talk-1',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush(createTalk());
  });

  it('should update a talk with the bearer token', () => {
    const payload: UpdateTalkRequest = {
      title: 'Angular atualizado',
      description: 'Descrição atualizada.',
      date: '2026-06-20',
      startTime: '20:00',
      folderUrl: null,
    };

    service.updateTalk('talk-1', payload).subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/talk-1',
    );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.request.body).toEqual(payload);

    request.flush(createTalk(payload));
  });

  it('should delete a talk with the bearer token', () => {
    service.deleteTalk('talk-1').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/talk-1',
    );

    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush({ message: 'Palestra deletada com sucesso.' });
  });
});

function createTalk(
  overrides: Partial<Omit<CreateTalkRequest, 'folderUrl'>> & {
    folderUrl?: string | null;
  } = {},
) {
  return {
    id: 'talk-1',
    title: 'Angular moderno',
    description: 'Palestra sobre Angular standalone.',
    date: '2026-06-15',
    startTime: '19:30',
    speaker: {
      id: 'speaker-1',
      fullName: 'Maria Palestrante',
    },
    ...overrides,
  };
}

function createTalksResponse(items: unknown[]) {
  return {
    items,
    meta: {
      page: 1,
      limit: 100,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  };
}
