import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = ''; email = ''; password = ''; confirmPassword = '';
  errorMessage = ''; successMessage = ''; loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  get passwordErrors(): string[] {
    const e: string[] = [];
    if (this.password.length > 0) {
      if (this.password.length < 8) e.push('Minimum 8 caractères');
      if (!/^[A-Z]/.test(this.password)) e.push('Doit commencer par une majuscule');
      if (!/^[A-Za-z0-9]+$/.test(this.password)) e.push('Lettres et chiffres uniquement');
      if (!/[0-9]/.test(this.password)) e.push('Doit contenir au moins un chiffre');
    }
    return e;
  }

  get isFormValid(): boolean {
    return this.username.length > 0 && this.email.length > 0
      && this.password.length >= 8 && this.passwordErrors.length === 0
      && this.password === this.confirmPassword;
  }

  onSubmit() {
    if (!this.isFormValid) return;
    this.errorMessage = ''; this.loading = true;
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Compte créé avec succès ! Redirection...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => { this.loading = false; this.errorMessage = err.error?.error || err.error?.message || 'Erreur.'; }
    });
  }
}
