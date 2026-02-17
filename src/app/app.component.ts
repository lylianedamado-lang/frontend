import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
