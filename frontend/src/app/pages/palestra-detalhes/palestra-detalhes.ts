import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Talk, TalksService } from '../../core/talks/talks.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-palestra-detalhes',
  imports: [RouterLink],
  templateUrl: './palestra-detalhes.html',
  styleUrl: './palestra-detalhes.scss',
})
export class PalestraDetalhes implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly talksService = inject(TalksService);
  private readonly toastService = inject(ToastService);

  protected readonly currentUser = this.authService.getCurrentUser();
  protected readonly talk = signal<Talk | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly hasError = signal(false);
  protected readonly isEnrolled = computed(() => {
    const talk = this.talk();

    if (!talk || !this.currentUser) {
      return false;
    }

    return talk.attendees.some((attendee) => attendee.id === this.currentUser?.id);
  });

  ngOnInit(): void {
    const talkId = this.route.snapshot.paramMap.get('id');

    if (!talkId) {
      void this.router.navigate(['/palestras']);
      return;
    }

    this.loadTalk(talkId);
  }

  protected enroll(): void {
    const talk = this.talk();

    if (!talk) {
      return;
    }

    this.isSubmitting.set(true);
    this.talksService
      .enroll(talk.id)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (updatedTalk) => {
          this.talk.set(updatedTalk);
          this.toastService.showSuccess('Inscrição realizada com sucesso.');
        },
        error: (error: unknown) => this.handleEnrollmentError(error),
      });
  }

  protected cancelEnrollment(): void {
    const talk = this.talk();

    if (!talk) {
      return;
    }

    this.isSubmitting.set(true);
    this.talksService
      .cancelEnrollment(talk.id)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (updatedTalk) => {
          this.talk.set(updatedTalk);
          this.toastService.showSuccess('Inscrição cancelada com sucesso.');
        },
        error: (error: unknown) => this.handleEnrollmentError(error),
      });
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

  private loadTalk(talkId: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.talksService
      .getTalk(talkId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (talk) => this.talk.set(talk),
        error: (error: unknown) => this.handleLoadError(error),
      });
  }

  private handleLoadError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.toastService.showError('Palestra não encontrada.');
      void this.router.navigate(['/palestras']);
      return;
    }

    this.hasError.set(true);
  }

  private handleEnrollmentError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.toastService.showError('Palestra não encontrada.');
      void this.router.navigate(['/palestras']);
      return;
    }

    this.toastService.showError(
      this.isEnrolled()
        ? 'Não foi possível cancelar a inscrição. Tente novamente.'
        : 'Não foi possível realizar a inscrição. Tente novamente.',
    );
  }
}
