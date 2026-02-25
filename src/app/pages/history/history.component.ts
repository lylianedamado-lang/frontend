import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleaningService } from '../../services/cleaning.service';
import { HistoryItem } from '../../models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  history: HistoryItem[] = [];
  loading = true;
  errorMessage = '';
  downloadingId: string | null = null;

  constructor(private cleaningService: CleaningService) {}

  ngOnInit() { this.loadHistory(); }

  loadHistory() {
    this.loading = true;
    this.cleaningService.getHistory().subscribe({
      next: (data) => { this.history = data; this.loading = false; },
      error: (err) => { this.loading = false; this.errorMessage = err.error?.error || 'Erreur.'; }
    });
  }

  downloadFile(item: HistoryItem) {
    if (!item.file_id || this.downloadingId) return;
    this.downloadingId = item.file_id;

    this.cleaningService.downloadFile(item.file_id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.downloadingId = null;
          this.errorMessage = 'Fichier de téléchargement invalide.';
          return;
        }

        this.downloadingId = null;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.cleaningService.getFilenameFromResponse(
          response,
          'cleaned_' + item.original_filename
        );
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingId = null;
        this.errorMessage = 'Erreur lors du téléchargement.';
      }
    });
  }

  getIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv': return 'bi-filetype-csv';
      case 'xlsx': case 'xls': return 'bi-filetype-xlsx';
      case 'json': return 'bi-filetype-json';
      case 'xml': return 'bi-filetype-xml';
      default: return 'bi-file-earmark';
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
