import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  selector: 'app-palestras',
  imports: [ReactiveFormsModule],
  templateUrl: './palestras.html',
  styleUrl: './palestras.scss',
})
export class Palestras implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly talksService = inject(TalksService);

  protected readonly currentUser = this.authService.getCurrentUser();
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly talks = signal<Talk[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasError = signal(false);

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
        }),
        switchMap((search) =>
          this.talksService.listTalks(search).pipe(
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

  private handleListError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    this.hasError.set(true);
  }
}
