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
  normalizeChoice: 'yes' | 'no' = 'no';
  method = '';
  statsAvant: any = null;
  isDragging = false;
  isAnalyzing = false;
  isCleaning = false;
  errorMessage = '';
  statsArray: { key: string, value: any }[] = [];

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
      this.handleFileSelection(droppedFile);
    }
  }

  onFileChange(e: any) {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      this.handleFileSelection(selectedFile);
    }
  }

  handleFileSelection(file: File) {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json', '.xml'];
    const fileName = file.name.toLowerCase();
    
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
      this.errorMessage = 'Format de fichier non supporté. Veuillez utiliser CSV, Excel, JSON ou XML.';
      return;
    }
    
    this.file = file;
    this.resetAnalysis();
    this.errorMessage = '';
  }

  resetAnalysis() {
    this.statsAvant = null;
    this.statsArray = [];
    this.normalizeChoice = 'no';
    this.method = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  analyzeFile() {
    if (!this.file) {
      this.errorMessage = 'Veuillez sélectionner un fichier d\'abord.';
      return;
    }
    
    this.isAnalyzing = true;
    this.errorMessage = '';
    
    // Analyser SANS normalisation (juste pour voir les stats avant)
    this.cleanService.cleanFile(this.file, false, '')
      .subscribe({
        next: (res) => {
          this.statsAvant = res.statistiques_avant;
          this.convertStatsToArray();
          this.isAnalyzing = false;
          console.log('Analyse réussie:', this.statsAvant);
        },
        error: (error) => {
          console.error('Erreur lors de l\'analyse:', error);
          this.errorMessage = 'Erreur lors de l\'analyse du fichier. Vérifiez que le backend est démarré.';
          this.isAnalyzing = false;
        }
      });
  }

  convertStatsToArray() {
    if (!this.statsAvant) {
      this.statsArray = [];
      return;
    }
    
    this.statsArray = Object.keys(this.statsAvant).map(key => ({
      key: this.formatStatKey(key),
      value: this.statsAvant[key]
    }));
  }

  formatStatKey(key: string): string {
    const keyMap: {[key: string]: string} = {
      'Lignes': 'Nombre de lignes',
      'Colonnes': 'Nombre de colonnes',
      'Valeurs Manquantes': 'Valeurs manquantes',
      'Valeurs Abberantes': 'Valeurs aberrantes',
      'Doublons': 'Nombre de doublons',
      'Colonnes Numeriques': 'Colonnes numériques',
      'Colonnes textes': 'Colonnes texte'
    };
    
    return keyMap[key] || key;
  }

  getMethodName(): string {
    const methodNames: {[key: string]: string} = {
      'minmax': 'Min-Max Scaling',
      'zscore': 'Z-Score Standardization',
      'robust': 'Robust Scaling'
    };
    
    return methodNames[this.method] || this.method;
  }

  canLaunchClean(): boolean {
    if (!this.file) return false;
    if (this.normalizeChoice === 'yes' && !this.method) return false;
    return true;
  }

  launchClean() {
    if (!this.canLaunchClean()) {
      if (this.normalizeChoice === 'yes' && !this.method) {
        this.errorMessage = 'Veuillez sélectionner une méthode de normalisation.';
      }
      return;
    }
    
    this.isCleaning = true;
    this.errorMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const normalize = this.normalizeChoice === 'yes';
    
    this.cleanService.cleanFile(this.file, normalize, this.method)
      .subscribe({
        next: (res) => {
          // Stocker TOUTES les données dans sessionStorage
          sessionStorage.setItem('cleanResult', JSON.stringify(res));
          sessionStorage.setItem('statsAvant', JSON.stringify(res.statistiques_avant));
          sessionStorage.setItem('statsApres', JSON.stringify(res.statistiques_apres));
          sessionStorage.setItem('downloadUrl', res.download_url);
          sessionStorage.setItem('fileName', res.fichier_sortie);
          sessionStorage.setItem('normalizationApplied', normalize.toString());
          sessionStorage.setItem('normalizationMethod', this.method);
          
          console.log('Nettoyage terminé, redirection vers les résultats');
          
          // Naviguer vers la page de résultats
          setTimeout(() => {
            this.router.navigate(['/result']);
            this.isCleaning = false;
          }, 300);
        },
        error: (error) => {
          console.error('Erreur lors du nettoyage:', error);
          this.errorMessage = error.message || 'Erreur lors du traitement du fichier';
          this.isCleaning = false;
        }
      });
  }
}