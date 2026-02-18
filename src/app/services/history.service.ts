import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { retry } from 'rxjs';

export interface HistoryItem {
  original_filename: string;
  cleaned_at: string;
  download_url?: string;
  downloadUrl?: string;
  file_url?: string;
  url?: string;
  cleaned_filename?: string;
  fichier_sortie?: string;
}

export interface HistoryResponse {
  history: HistoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  constructor(private http: HttpClient) {}

  getHistory() {
    return this.http.get<HistoryResponse>(
      `${environment.apiUrl}/history`,
      { withCredentials: true }
    ).pipe(
      retry({ count: 1, delay: 250 })
    );
  }

  downloadFromHistory(downloadUrl: string) {
    const requestUrl = this.buildDownloadUrl(downloadUrl);

    return this.http.get(
      requestUrl,
      {
        responseType: 'blob',
        withCredentials: true
      }
    );
  }

  private buildDownloadUrl(downloadUrl: string): string {
    if (/^https?:\/\//i.test(downloadUrl)) {
      return downloadUrl;
    }

    const apiBase = environment.apiUrl.replace(/\/+$/, '');
    const normalizedPath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
    return `${apiBase}${normalizedPath}`;
  }
}
