import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Talk, TalksResponse, TalksService } from '../../core/talks/talks.service';
import { MinhasPalestras } from './minhas-palestras';

describe('MinhasPalestras', () => {
  let fixture: ComponentFixture<MinhasPalestras>;
  let listMyTalksResponse: Observable<TalksResponse>;
  let lastSearch: string | null;
  let logoutSpy: jasmine.Spy;

  beforeEach(async () => {
    lastSearch = null;
    logoutSpy = jasmine.createSpy('logout');
    listMyTalksResponse = of(createTalksResponse([createTalk()]));

    await TestBed.configureTestingModule({
      imports: [MinhasPalestras],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({
              id: 'speaker-1',
              fullName: 'Maria Palestrante',
              email: 'maria@email.com',
              phone: '11999999999',
              title: 'Mestrado',
              role: 'Palestrante',
            }),
            logout: logoutSpy,
          },
        },
        {
          provide: TalksService,
          useValue: {
            listMyTalks: (search = '') => {
              lastSearch = search;
              return listMyTalksResponse;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasPalestras);
  });

  it('should render the page heading, search and create action', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Minhas Palestras');
    expect(compiled.querySelector('input[type="search"]')).toBeTruthy();
    expect(compiled.querySelector('.primary-action')?.textContent).toContain(
      'Criar palestra',
    );
  }));

  it('should load and render my talks', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(lastSearch).toBe('');
    expect(compiled.textContent).toContain('Angular moderno');
    expect(compiled.textContent).toContain('Palestra sobre Angular standalone.');
    expect(compiled.textContent).toContain('15/06/2026');
    expect(compiled.textContent).toContain('19:30');
    expect(compiled.querySelector('.material-link')?.getAttribute('href')).toBe(
      'https://example.com/palestra',
    );
  }));

  it('should show the empty state when there are no talks', fakeAsync(() => {
    listMyTalksResponse = of(createTalksResponse([]));

    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Você ainda não cadastrou nenhuma palestra.',
    );
  }));

  it('should search my talks with the informed term', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    fillInput(fixture.nativeElement, 'input[type="search"]', ' angular ');
    tick(250);

    expect(lastSearch).toBe(' angular ');
  }));

  it('should logout and navigate to login when backend returns unauthorized', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 401 }));

    fixture.detectChanges();
    tick(250);

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should show a permission message when backend returns forbidden', fakeAsync(() => {
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 403 }));

    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Apenas palestrantes podem acessar esta listagem.',
    );
  }));

  it('should show a generic error message when loading fails', fakeAsync(() => {
    listMyTalksResponse = throwError(() => new HttpErrorResponse({ status: 500 }));

    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não foi possível carregar suas palestras. Tente novamente.',
    );
  }));
});

function createTalk(overrides: Partial<Talk> = {}): Talk {
  return {
    id: 'talk-1',
    title: 'Angular moderno',
    description: 'Palestra sobre Angular standalone.',
    date: '2026-06-15',
    startTime: '19:30:00',
    folderUrl: 'https://example.com/palestra',
    speaker: {
      id: 'speaker-1',
      fullName: 'Maria Palestrante',
    },
    ...overrides,
  };
}

function createTalksResponse(items: Talk[]): TalksResponse {
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

function fillInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
