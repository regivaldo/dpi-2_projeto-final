import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { TalksService } from '../../core/talks/talks.service';
import { Palestras } from './palestras';

describe('Palestras', () => {
  let fixture: ComponentFixture<Palestras>;
  let listTalksSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listTalksSpy = vi.fn().mockReturnValue(
      of({
        items: [
          {
            id: '1',
            title: 'Arquitetura de APIs com NestJS',
            description: 'Boas práticas para APIs.',
            date: '2026-07-10',
            startTime: '19:00:00',
            speaker: {
              id: 'speaker-1',
              fullName: 'Maria Palestrante',
            },
          },
        ],
        meta: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [Palestras],
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
            logout: vi.fn(),
          },
        },
        {
          provide: TalksService,
          useValue: {
            listTalks: listTalksSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Palestras);
  });

  it('should show the talk list content', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Conteúdos disponíveis');
    expect(compiled.textContent).toContain('Arquitetura de APIs com NestJS');
    expect(compiled.textContent).toContain('Criado por: Maria Palestrante');
    expect(compiled.querySelector('img.talk-image')).toBeTruthy();
  }));

  it('should search talks with the typed term', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);

    const input = fixture.nativeElement.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;
    input.value = 'nestjs';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    tick(250);

    expect(listTalksSpy).toHaveBeenCalledWith('nestjs');
  }));
});
