import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(
    public auth: AuthService,
    private state: StateService,
    private router: Router
  ) {}

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.state.reset();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.state.reset();
        this.router.navigate(['/login']);
      }
    });
  }
}
