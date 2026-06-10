import { Injectable, signal } from '@angular/core';

export type ToastType = 'error';

export interface ToastMessage {
  text: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timeoutId?: number;
  readonly message = signal<ToastMessage | null>(null);

  showError(text: string): void {
    this.show({ text, type: 'error' });
  }

  dismiss(): void {
    window.clearTimeout(this.timeoutId);
    this.message.set(null);
  }

  private show(message: ToastMessage): void {
    window.clearTimeout(this.timeoutId);
    this.message.set(message);
    this.timeoutId = window.setTimeout(() => this.dismiss(), 4500);
  }
}
