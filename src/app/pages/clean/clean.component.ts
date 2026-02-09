import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CleanService } from '../../services/clean.service';
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
  statsAvant: any = null;
  isDragging = false;
  fileSize = '';
  normalizationError = '';

  constructor(
    private cleanService: CleanService,
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
        this.clearNormalizationError();
      } else {
        alert('Format de fichier non supporté. Veuillez utiliser CSV, Excel, JSON ou XML.');
      }
    }
  }

  isValidFileType(file: File): boolean {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  onFileChange(e: any) {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (this.isValidFileType(selectedFile)) {
        this.file = selectedFile;
        this.fileSize = this.formatFileSize(this.file.size);
        this.clearNormalizationError();
      } else {
        alert('Format de fichier non supporté. Veuillez utiliser CSV, Excel, JSON ou XML.');
        e.target.value = '';
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
    this.cleanService.analyzeFile(this.file)
      .subscribe({
        next: (res) => {
          this.statsAvant = { ...res.statistiques_avant };
          sessionStorage.setItem('statsAvant', JSON.stringify(this.statsAvant));
          this.clearNormalizationError();
        },
        error: (err) => console.error('Erreur analyse:', err)
      });
  }

  getStatsCount(): number {
    if (!this.statsAvant) return 0;
    return Object.keys(this.statsAvant).length;
  }

  applyNormalization() {
    console.log('applyNormalization appelé');
    console.log('normalizeChoice:', this.normalizeChoice);
    console.log('method:', this.method);
    
    this.clearNormalizationError();
    
    // Validation 1: Si pas de choix de normalisation
    if (this.normalizeChoice === null) {
      this.normalizationError = 'Veuillez choisir si vous voulez normaliser les données.';
      console.log('Erreur 1:', this.normalizationError);
      return;
    }
    
    // Validation 2: Si oui mais pas de méthode
    if (this.normalizeChoice === 'yes' && !this.method) {
      this.normalizationError = 'Veuillez choisir une méthode de normalisation avant de continuer.';
      console.log('Erreur 2:', this.normalizationError);
      return;
    }

    console.log('Validation OK, appel performCleaning');
    this.performCleaning();
  }

  performCleaning() {
    if (!this.file) {
      console.error('Pas de fichier!');
      return;
    }

    const normalize = this.normalizeChoice === 'yes';
    console.log('performCleaning - normalize:', normalize, 'method:', this.method);

    this.cleanService.cleanFile(this.file, normalize, this.method)
      .subscribe({
        next: (res) => {
          console.log('Nettoyage réussi:', res);
          sessionStorage.setItem('cleanResult', JSON.stringify(res));
          this.router.navigate(['/result']);
        },
        error: (err) => {
          console.error('Erreur nettoyage:', err);
          this.normalizationError = 'Erreur lors du nettoyage: ' + err.message;
        }
      });
  }

  onMethodChange() {
    console.log('Méthode changée:', this.method);
    if (this.method) {
      this.clearNormalizationError();
    }
  }

  clearNormalizationError() {
    this.normalizationError = '';
    console.log('Erreur effacée');
  }
}