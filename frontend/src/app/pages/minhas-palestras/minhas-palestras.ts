import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Talk, TalksService } from '../../core/talks/talks.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-minhas-palestras',
  imports: [ReactiveFormsModule, RouterLink, ConfirmModal],
  templateUrl: './minhas-palestras.html',
  styleUrl: './minhas-palestras.scss',
})
export class MinhasPalestras implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly talksService = inject(TalksService);
  private readonly toastService = inject(ToastService);

  protected readonly currentUser = this.authService.getCurrentUser();
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly talks = signal<Talk[]>([]);
  protected readonly selectedTalkToDelete = signal<Talk | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly hasError = signal(false);
  protected readonly isForbidden = signal(false);

  constructor() {
    if (!this.currentUser) {
      return;
    }

    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.isLoading.set(true);
          this.hasError.set(false);
          this.isForbidden.set(false);
        }),
        switchMap((search) =>
          this.talksService.listMyTalks(search).pipe(
            catchError((error: unknown) => {
              this.handleListError(error);
              return of({ items: [] });
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => this.talks.set(response.items));
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      void this.router.navigate(['/login']);
    }
  }

  protected formatDate(date: string): string {
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      return date;
    }

    return `${day}/${month}/${year}`;
  }

  protected formatTime(startTime: string): string {
    return startTime.slice(0, 5);
  }

  protected formatAttendeesCount(talk: Talk): string {
    const count = talk.attendees.length;

    return `${count} ${count === 1 ? 'Inscrito' : 'Inscritos'}`;
  }

  protected openDeleteModal(talk: Talk): void {
    this.selectedTalkToDelete.set(talk);
  }

  protected closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.selectedTalkToDelete.set(null);
  }

  protected confirmDelete(): void {
    const talk = this.selectedTalkToDelete();

    if (!talk) {
      return;
    }

    this.isDeleting.set(true);
    this.talksService
      .deleteTalk(talk.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.talks.update((items) => items.filter((item) => item.id !== talk.id));
          this.selectedTalkToDelete.set(null);
          this.toastService.showSuccess('Palestra deletada com sucesso.');
        },
        error: (error: unknown) => this.handleDeleteError(error),
      });
  }

  private handleListError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      this.isForbidden.set(true);
      return;
    }

    this.hasError.set(true);
  }

  private handleDeleteError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      this.toastService.showError('Você não pode deletar esta palestra.');
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.toastService.showError('Palestra não encontrada.');
      this.selectedTalkToDelete.set(null);
      return;
    }

    this.toastService.showError(
      'Não foi possível deletar a palestra. Tente novamente.',
    );
  }
}
