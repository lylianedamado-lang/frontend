import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CleanService, StatsMap } from '../../services/clean.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-clean',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clean.component.html',
  styleUrls: ['./clean.component.css']
})
export class CleanComponent implements OnDestroy {
  file!: File;
  normalizeChoice: 'yes' | 'no' | null = null;
  method = '';
  statsAvant: StatsMap | null = null;
  isDragging = false;
  fileSize = '';
  normalizationError = '';
  analyzeError = '';
  isAnalyzing = false;
  isCleaning = false;
  pageMessage = '';
  pageMessageType: 'info' | 'success' | 'error' = 'info';
  private analyzeSub: Subscription | null = null;

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
        this.prepareFile(droppedFile);
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
        this.prepareFile(selectedFile);
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

    if (this.analyzeSub) {
      this.analyzeSub.unsubscribe();
      this.analyzeSub = null;
    }

    this.isAnalyzing = true;
    this.analyzeError = '';

    this.analyzeSub = this.cleanService.analyzeFile(this.file)
      .pipe(
        finalize(() => {
          this.isAnalyzing = false;
          this.analyzeSub = null;
        })
      )
      .subscribe({
        next: (res) => {
          this.statsAvant = { ...(res.statistiques_avant || {}) };
          sessionStorage.setItem('statsAvant', JSON.stringify(this.statsAvant));
          this.pageMessage = '';
          this.clearNormalizationError();
        },
        error: (err) => {
          console.error('Erreur analyse:', err);
          this.analyzeError = err?.error?.error || 'Impossible d’analyser le fichier pour le moment.';
        }
      });
  }

  ngOnDestroy(): void {
    if (this.analyzeSub) {
      this.analyzeSub.unsubscribe();
      this.analyzeSub = null;
    }
  }

  getStatsCount(): number {
    if (!this.statsAvant) return 0;
    return Object.keys(this.statsAvant).length;
  }

  applyNormalization() {
    this.clearNormalizationError();
    
    if (this.normalizeChoice === null) {
      this.normalizationError = 'Veuillez choisir si vous voulez normaliser les données ou non.';
      this.setPageMessage('', 'info');
      return;
    }
    
    if (this.normalizeChoice === 'yes' && !this.method) {
      this.normalizationError = ' Choisir une méthode de normalisation pour continuer.';
      this.setPageMessage('', 'info');
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
          this.setPageMessage('', 'info');
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

  private prepareFile(file: File): void {
    if (this.analyzeSub) {
      this.analyzeSub.unsubscribe();
      this.analyzeSub = null;
    }
    this.isAnalyzing = false;
    this.file = file;
    this.fileSize = this.formatFileSize(this.file.size);
    this.statsAvant = null;
    this.method = '';
    this.normalizeChoice = null;
    this.setPageMessage('', 'info');
    this.analyzeError = '';
    this.clearNormalizationError();
  }
}
