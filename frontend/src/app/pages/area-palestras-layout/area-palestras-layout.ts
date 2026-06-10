import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-area-palestras-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './area-palestras-layout.html',
  styleUrl: './area-palestras-layout.scss',
})
export class AreaPalestrasLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.getCurrentUser();
  protected readonly isSpeaker = this.currentUser?.role === 'Palestrante';

  ngOnInit(): void {
    if (!this.currentUser) {
      void this.router.navigate(['/login']);
    }
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
