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

@Component({
  selector: 'app-minhas-palestras',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './minhas-palestras.html',
  styleUrl: './minhas-palestras.scss',
})
export class MinhasPalestras implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly talksService = inject(TalksService);

  protected readonly currentUser = this.authService.getCurrentUser();
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly talks = signal<Talk[]>([]);
  protected readonly isLoading = signal(false);
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
}
