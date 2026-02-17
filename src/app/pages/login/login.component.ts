import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

 goToRegister() {
  this.router.navigate(['/register']);
}



  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.successMessage = 'Connexion réussie. Redirection...';
        setTimeout(() => {
          this.router.navigate(['/clean']);
        }, 1000);
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect.';
        } else {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer.';
        }
        this.loading = false;
      }
    });
  }
}
