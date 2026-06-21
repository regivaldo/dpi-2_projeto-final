import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  protected readonly titleOptions = [
    'Técnico',
    'Graduação',
    'Pós-Graduação',
    'Mestrado',
    'Doutorado',
  ];
  protected readonly roleOptions = ['Usuário', 'Palestrante'];
  protected readonly cadastroForm = new FormGroup(
    {
      fullName: new FormControl('', [Validators.required]),
      birthDate: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        ),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required]),
      title: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchesValidator },
  );
  protected isSubmitting = false;
  protected registrationCompleted = false;

  protected submitCadastro(): void {
    const errorMessage = this.getValidationMessage();

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      this.toastService.showError(errorMessage);
      return;
    }

    const formValue = this.cadastroForm.getRawValue();
    this.isSubmitting = true;
    this.authService
      .register({
        fullName: formValue.fullName?.trim() ?? '',
        birthDate: formValue.birthDate ?? '',
        email: formValue.email?.trim() ?? '',
        password: formValue.password ?? '',
        phone: formValue.phone?.trim() ?? '',
        title: formValue.title ?? '',
        role: formValue.role ?? '',
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.registrationCompleted = true;
          this.cadastroForm.reset();
        },
        error: (error: unknown) => this.handleCadastroError(error),
      });
  }

  private getValidationMessage(): string {
    return (
      this.getRequiredFieldsMessage() ||
      this.getPasswordValidationMessage() ||
      'Confira os dados informados antes de finalizar o cadastro.'
    );
  }

  private getRequiredFieldsMessage(): string {
    const requiredFields = [
      { label: 'nome completo', value: this.cadastroForm.controls.fullName.value },
      {
        label: 'data de nascimento',
        value: this.cadastroForm.controls.birthDate.value,
      },
      { label: 'e-mail', value: this.cadastroForm.controls.email.value },
      { label: 'senha', value: this.cadastroForm.controls.password.value },
      {
        label: 'confirmaão de senha',
        value: this.cadastroForm.controls.confirmPassword.value,
      },
      { label: 'telefone', value: this.cadastroForm.controls.phone.value },
      { label: 'titulaão', value: this.cadastroForm.controls.title.value },
      { label: 'perfil', value: this.cadastroForm.controls.role.value },
    ];
    const emptyFields = requiredFields
      .filter((field) => !field.value?.trim())
      .map((field) => field.label);

    if (emptyFields.length === 0) {
      return '';
    }

    if (emptyFields.length === 1) {
      return `O campo ${emptyFields[0]} é de preenchimento obrigatório`;
    }

    return `Os campos ${this.formatFieldList(
      emptyFields,
    )} são de preenchimento obrigatório`;
  }

  private getPasswordValidationMessage(): string {
    const password = this.cadastroForm.controls.password;

    if (password.hasError('minlength') || password.hasError('pattern')) {
      return 'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.';
    }

    if (this.cadastroForm.hasError('passwordMismatch')) {
      return 'A senha e a confirmaão de senha devem ser iguais.';
    }

    return '';
  }

  private formatFieldList(fields: string[]): string {
    const lastField = fields.at(-1);
    const previousFields = fields.slice(0, -1);

    return `${previousFields.join(', ')} e ${lastField}`;
  }

  private handleCadastroError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      this.toastService.showError('E-mail já cadastrado.');
      return;
    }

    this.toastService.showError(
      'Não foi possível concluir o cadastro. Tente novamente.',
    );
  }
}

function passwordMatchesValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
}
