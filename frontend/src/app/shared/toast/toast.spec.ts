import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastService } from './toast.service';

describe('Toast', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
    }).compileComponents();
  });

  it('should render an error toast message', () => {
    const fixture = TestBed.createComponent(Toast);
    const toastService = TestBed.inject(ToastService);

    toastService.showError('Mensagem de erro');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.toast-error')?.textContent).toContain(
      'Mensagem de erro',
    );
    toastService.dismiss();
  });
});
