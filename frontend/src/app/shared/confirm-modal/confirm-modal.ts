import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModal {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmText = input('Confirmar');
  readonly cancelText = input('Cancelar');
  readonly isLoading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
