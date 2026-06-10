import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CreateTalkRequest, TalksService } from '../../core/talks/talks.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-criar-palestra',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './criar-palestra.html',
  styleUrl: './criar-palestra.scss',
})
export class CriarPalestra {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly talksService = inject(TalksService);
  private readonly toastService = inject(ToastService);

  protected readonly palestraForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startTime: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    folderUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^https?:\/\/\S+$/)],
    }),
  });
  protected isSubmitting = false;

  protected submitPalestra(): void {
    if (this.palestraForm.invalid || this.hasBlankRequiredFields()) {
      this.palestraForm.markAllAsTouched();
      this.toastService.showError(this.getValidationMessage());
      return;
    }

    const payload = this.buildCreateTalkPayload();
    this.isSubmitting = true;

    this.talksService
      .createTalk(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Palestra cadastrada com sucesso.');
          void this.router.navigate(['/palestras/minhas']);
        },
        error: (error: unknown) => this.handleCreateError(error),
      });
  }

  private buildCreateTalkPayload(): CreateTalkRequest {
    const formValue = this.palestraForm.getRawValue();
    const folderUrl = formValue.folderUrl.trim();
    const payload: CreateTalkRequest = {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      date: formValue.date,
      startTime: formValue.startTime,
    };

    if (folderUrl) {
      payload.folderUrl = folderUrl;
    }

    return payload;
  }

  private hasBlankRequiredFields(): boolean {
    return (
      !this.palestraForm.controls.title.value.trim() ||
      !this.palestraForm.controls.description.value.trim() ||
      !this.palestraForm.controls.date.value.trim() ||
      !this.palestraForm.controls.startTime.value.trim()
    );
  }

  private getValidationMessage(): string {
    const requiredFields = [
      { label: 'título', value: this.palestraForm.controls.title.value },
      { label: 'descrição', value: this.palestraForm.controls.description.value },
      { label: 'data', value: this.palestraForm.controls.date.value },
      { label: 'horário', value: this.palestraForm.controls.startTime.value },
    ];
    const emptyFields = requiredFields
      .filter((field) => !field.value.trim())
      .map((field) => field.label);

    if (emptyFields.length === 1) {
      return `O campo ${emptyFields[0]} é de preenchimento obrigatório.`;
    }

    if (emptyFields.length > 1) {
      return `Os campos ${this.formatFieldList(
        emptyFields,
      )} são de preenchimento obrigatório.`;
    }

    if (this.palestraForm.controls.title.hasError('maxlength')) {
      return 'O título deve ter no máximo 180 caracteres.';
    }

    if (this.palestraForm.controls.folderUrl.hasError('pattern')) {
      return 'Informe uma URL válida começando com http:// ou https://.';
    }

    return 'Confira os dados informados antes de cadastrar a palestra.';
  }

  private formatFieldList(fields: string[]): string {
    const lastField = fields.at(-1);
    const previousFields = fields.slice(0, -1);

    return `${previousFields.join(', ')} e ${lastField}`;
  }

  private handleCreateError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      this.toastService.showError('Apenas palestrantes podem cadastrar palestras.');
      return;
    }

    this.toastService.showError(
      'Não foi possível cadastrar a palestra. Tente novamente.',
    );
  }
}
