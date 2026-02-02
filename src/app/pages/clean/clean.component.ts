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
    } else {
      alert('Format de fichier non supporté. Veuillez utiliser CSV, Excel, JSON ou XML.');
    }
  }
}


  isValidFileType(file: File): boolean {
  const validExtensions = ['.csv', '.xlsx', '.xls', 'Excel', '.json', '.xml'];
  const fileName = file.name.toLowerCase();
  
  return validExtensions.some(ext => fileName.endsWith(ext));
}
 onFileChange(e: any) {
  if (e.target.files && e.target.files.length > 0) {
    const selectedFile = e.target.files[0];
    
    if (this.isValidFileType(selectedFile)) {
      this.file = selectedFile;
      this.fileSize = this.formatFileSize(this.file.size);
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
      },
      error: (err) => console.error(err)
    });
}

  getStatsCount(): number {
  if (!this.statsAvant) return 0;
  return Object.keys(this.statsAvant).length;
}

applyNormalization() {
  if (!this.file) return;

  const normalize = this.normalizeChoice === 'yes';

  this.cleanService.cleanFile(this.file, normalize, this.method)
    .subscribe({
      next: (res) => {
        sessionStorage.setItem('cleanResult', JSON.stringify(res));
        this.router.navigate(['/result']);
      },
      error: (err) => console.error(err)
    });
}


  goToResult() {
  if (this.normalizeChoice && (this.normalizeChoice === 'no' || (this.normalizeChoice === 'yes' && this.method))) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      this.router.navigate(['/result']);
    }, 100);
  }
}
}