import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { HistoryItem, HistoryResponse, HistoryService } from '../../services/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  history: HistoryItem[] = [];
  loading = true;
  errorMessage = '';
  downloadError = '';
  downloadingFile = '';

  constructor(private historyService: HistoryService) {}


  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.historyService.getHistory().subscribe({
      next: (res: HistoryResponse) => {
        this.history = res.history || [];
        this.errorMessage = '';
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = "Impossible de charger l'historique.";
        this.loading = false;
        console.error(err);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  download(item: HistoryItem): void {
    const resolvedUrl = this.resolveDownloadUrl(item);
    if (!resolvedUrl) {
      this.downloadError = 'Ce fichier ne peut pas être retéléchargé pour le moment.';
      return;
    }

    this.downloadError = '';
    this.downloadingFile = this.getItemKey(item);

    this.historyService.downloadFromHistory(resolvedUrl).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = item.cleaned_filename || item.fichier_sortie || item.original_filename || 'fichier_nettoye';
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.downloadingFile = '';
      },
      error: (_err: HttpErrorResponse) => {
        this.downloadError = 'Téléchargement impossible. Veuillez réessayer.';
        this.downloadingFile = '';
      }
    });
  }

  isDownloadAvailable(item: HistoryItem): boolean {
    return this.resolveDownloadUrl(item) !== null;
  }

  getItemKey(item: HistoryItem): string {
    return `${item.original_filename}-${item.cleaned_at}`;
  }

  private resolveDownloadUrl(item: HistoryItem): string | null {
    const directUrl =
      item.download_url ||
      item.downloadUrl ||
      item.file_url ||
      item.url;

    if (directUrl) {
      return directUrl;
    }

    const filename = item.cleaned_filename || item.fichier_sortie || item.original_filename;
    if (!filename) {
      return null;
    }

    return `/download/${encodeURIComponent(filename)}`;
  }

}
