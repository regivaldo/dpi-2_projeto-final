import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  protected readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });
  protected isSubmitting = false;

  protected submitLogin(): void {
    const errorMessage = this.getRequiredFieldsMessage();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      if (errorMessage) {
        this.toastService.showError(errorMessage);
      }
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isSubmitting = true;
    this.authService
      .login({
        email: email?.trim() ?? '',
        password: password ?? '',
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => void this.router.navigate(['/palestras']),
        error: (error: unknown) => this.handleLoginError(error),
      });
  }

  private getRequiredFieldsMessage(): string {
    const emailIsEmpty = !this.loginForm.controls.email.value?.trim();
    const passwordIsEmpty = !this.loginForm.controls.password.value?.trim();

    if (emailIsEmpty && passwordIsEmpty) {
      return 'Os campos e-mail e senha s\u00e3o de preenchimento obrigat\u00f3rio';
    }

    if (emailIsEmpty) {
      return 'O campo e-mail \u00e9 de preenchimento obrigat\u00f3rio';
    }

    if (passwordIsEmpty) {
      return 'O campo senha \u00e9 de preenchimento obrigat\u00f3rio';
    }

    return '';
  }

  private handleLoginError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.toastService.showError('E-mail ou senha inv\u00e1lidos.');
      return;
    }

    this.toastService.showError(
      'N\u00e3o foi poss\u00edvel autenticar. Tente novamente.',
    );
  }
}
