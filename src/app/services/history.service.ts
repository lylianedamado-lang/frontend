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
    return this.http.get(
      `${environment.apiUrl}${downloadUrl}`,
      {
        responseType: 'blob',
        withCredentials: true
      }
    );
  }
}
