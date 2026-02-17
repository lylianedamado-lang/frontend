import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLinkActive],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  username: string = '';
  email: string = '';
  password: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

 goToLogin() {
  this.router.navigate(['/login']);
}


  onRegister() {

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Tous les champs sont obligatoires.';
      this.loading = false;
      return;
    }

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({

      next: () => {
        this.successMessage = 'Compte créé avec succès. Redirection vers la connexion...';
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },

      
      error: (err) => {
        this.loading = false;

        if (err.status === 409) {
          this.errorMessage = 'Un compte existe déjà avec cet email ou ce nom d’utilisateur.';
        }
        else if (err.status === 400) {
          this.errorMessage = err.error?.error || 
          'Le mot de passe doit commencer par une majuscule, contenir au moins 8 caractères et inclure des chiffres.';
        }
        else {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
      }

    });
  }
}
