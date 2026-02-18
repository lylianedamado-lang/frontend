import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { HistoryItem, HistoryResponse, HistoryService } from '../../services/history.service';
import { environment } from '../../../environments/environment';

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

    const absoluteUrl = this.toAbsoluteUrl(resolvedUrl);
    const a = document.createElement('a');
    a.href = absoluteUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      this.downloadingFile = '';
    }, 1200);
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

    if (item.file_id) {
      return `/download/${encodeURIComponent(item.file_id)}`;
    }

    const filename = item.cleaned_filename || item.fichier_sortie || item.original_filename;
    if (!filename) {
      return null;
    }

    return `/download/${encodeURIComponent(filename)}`;
  }

  private toAbsoluteUrl(downloadUrl: string): string {
    if (/^https?:\/\//i.test(downloadUrl)) {
      return downloadUrl;
    }
    return `${environment.apiUrl}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
  }

}
