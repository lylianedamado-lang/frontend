import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CleanService, StatsMap } from '../../services/clean.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clean',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clean.component.html',
  styleUrls: ['./clean.component.css']
})
export class CleanComponent {
  file!: File;
  normalizeChoice: 'yes' | 'no' | null = null;
  method = '';
  statsAvant: StatsMap | null = null;
  isDragging = false;
  fileSize = '';
  normalizationError = '';
  isCleaning = false;
  pageMessage = '';
  pageMessageType: 'info' | 'success' | 'error' = 'info';

  constructor(
    private cleanService: CleanService,
    private authService: AuthService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files[0];
      
      if (this.isValidFileType(droppedFile)) {
        this.file = droppedFile;
        this.fileSize = this.formatFileSize(this.file.size);
        this.statsAvant = null;
        this.method = '';
        this.normalizeChoice = null;
        this.setPageMessage('', 'info');
        this.clearNormalizationError();
      } else {
        this.setPageMessage('Format non supporté. Utilisez CSV, Excel, JSON ou XML.', 'error');
      }
    }
  }

  isValidFileType(file: File): boolean {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      
      if (this.isValidFileType(selectedFile)) {
        this.file = selectedFile;
        this.fileSize = this.formatFileSize(this.file.size);
        this.statsAvant = null;
        this.method = '';
        this.normalizeChoice = null;
        this.setPageMessage('', 'info');
        this.clearNormalizationError();
      } else {
        this.setPageMessage('Format non supporté. Utilisez CSV, Excel, JSON ou XML.', 'error');
        input.value = '';
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  launchClean() {
    if (!this.file) return;

    if (this.authService.isAuthenticated()) {
      this.runAnalyze();
      return;
    }

    this.authService.checkSession().subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.setPageMessage('Veuillez vous connecter pour analyser un fichier.', 'error');
        this.router.navigate(['/login']);
        return;
      }

      this.runAnalyze();
    });
  }

  private runAnalyze() {
    this.cleanService.analyzeFile(this.file)
      .subscribe({
        next: (res) => {
          this.statsAvant = { ...(res.statistiques_avant || {}) };
          sessionStorage.setItem('statsAvant', JSON.stringify(this.statsAvant));
          this.pageMessage = '';
          this.clearNormalizationError();
        },
        error: (err) => {
          console.error('Erreur analyse:', err);
          this.pageMessage = err?.error?.error || 'Impossible d’analyser le fichier pour le moment.';
          this.pageMessageType = 'error';
        }
      });
  }

  getStatsCount(): number {
    if (!this.statsAvant) return 0;
    return Object.keys(this.statsAvant).length;
  }

  applyNormalization() {
    this.clearNormalizationError();
    
    if (this.normalizeChoice === null) {
      this.normalizationError = 'Veuillez choisir si vous voulez normaliser les données.';
      this.setPageMessage('Choisissez une option de normalisation pour continuer.', 'error');
      return;
    }
    
    if (this.normalizeChoice === 'yes' && !this.method) {
      this.normalizationError = 'Veuillez choisir une méthode de normalisation avant de continuer.';
      this.setPageMessage('Sélectionnez une méthode de normalisation.', 'error');
      return;
    }

    this.performCleaning();
  }

  performCleaning() {
    if (!this.file || this.isCleaning) {
      return;
    }

    const normalize = this.normalizeChoice === 'yes';
    this.isCleaning = true;
    this.setPageMessage('Nettoyage en cours... vous serez redirigé vers les résultats.', 'info');

    this.cleanService.cleanFile(this.file, normalize, this.method)
      .subscribe({
        next: (res) => {
          sessionStorage.setItem('cleanResult', JSON.stringify(res));
          this.isCleaning = false;
          this.setPageMessage('Nettoyage terminé. Redirection vers la page Résultats...', 'success');
          this.router.navigate(['/result']);
        },
        error: (err) => {
          this.isCleaning = false;
          this.normalizationError = err?.error?.error || 'Erreur lors du nettoyage. Veuillez réessayer.';
          this.setPageMessage(this.normalizationError, 'error');
        }
      });
  }

  onMethodChange() {
    if (this.method) {
      this.clearNormalizationError();
    }
  }

  clearNormalizationError() {
    this.normalizationError = '';
  }

  private setPageMessage(
    message: string,
    type: 'info' | 'success' | 'error'
  ): void {
    this.pageMessage = message;
    this.pageMessageType = type;
  }
}
