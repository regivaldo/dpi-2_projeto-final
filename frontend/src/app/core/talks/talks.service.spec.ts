import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import {
  CreateTalkRequest,
  Talk,
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
    expectFormData(request.request.body, {
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
      folderUrl: 'https://example.com/palestra',
    });

    request.flush(createTalk(payload));
  });

  it('should send cover image when creating a talk', () => {
    const coverImage = new File(['cover'], 'capa.png', { type: 'image/png' });
    const payload: CreateTalkRequest = {
      title: 'Angular moderno',
      description: 'Palestra sobre Angular standalone.',
      date: '2026-06-15',
      startTime: '19:30',
      coverImage,
    };

    service.createTalk(payload).subscribe();

    const request = httpTestingController.expectOne('http://localhost:3000/talks');

    expect(request.request.body).toBeInstanceOf(FormData);
    expect(request.request.body.get('coverImage')).toBe(coverImage);

    request.flush(createTalk({ coverImageUrl: '/uploads/talk-covers/capa.png' }));
  });

  it('should resolve relative cover image URLs against the API URL', () => {
    expect(service.resolveCoverImageUrl('/uploads/talk-covers/capa.png')).toBe(
      'http://localhost:3000/uploads/talk-covers/capa.png',
    );
    expect(service.resolveCoverImageUrl(null)).toBeNull();
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
    expectFormData(request.request.body, {
      title: 'Angular atualizado',
      description: 'Descrição atualizada.',
      date: '2026-06-20',
      startTime: '20:00',
      folderUrl: '',
    });

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

  it('should enroll in a talk with the bearer token', () => {
    service.enroll('talk-1').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/talk-1/enrollments',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.request.body).toEqual({});

    request.flush(createTalk());
  });

  it('should cancel enrollment with the bearer token', () => {
    service.cancelEnrollment('talk-1').subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost:3000/talks/talk-1/enrollments/me',
    );

    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush(createTalk());
  });
});

function createTalk(overrides: Partial<Talk> = {}): Talk {
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
    attendees: [],
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

function expectFormData(body: unknown, values: Record<string, string>): void {
  expect(body).toBeInstanceOf(FormData);
  const formData = body as FormData;

  Object.entries(values).forEach(([key, value]) => {
    expect(formData.get(key)).toBe(value);
  });
}
