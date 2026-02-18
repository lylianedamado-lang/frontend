import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map, retry, tap } from 'rxjs';

export interface HistoryItem {
  file_id?: string;
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

type HistoryApiResponse = HistoryResponse | HistoryItem[];

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly historyStorageKey = 'historyCache';
  private historySubject = new BehaviorSubject<HistoryItem[]>(this.readCachedHistory());
  history$ = this.historySubject.asObservable();

  constructor(private http: HttpClient) {}

  getCachedHistory(): HistoryItem[] {
    return this.historySubject.value;
  }

  getHistory() {
    return this.http.get<HistoryApiResponse>(
      `${environment.apiUrl}/history`,
      { withCredentials: true }
    ).pipe(
      retry({ count: 1, delay: 450 }),
      map((response) => {
        if (Array.isArray(response)) {
          return { history: response };
        }
        return { history: response.history || [] };
      }),
      tap((response) => {
        this.historySubject.next(response.history);
        sessionStorage.setItem(this.historyStorageKey, JSON.stringify(response.history));
      })
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

  private readCachedHistory(): HistoryItem[] {
    const raw = sessionStorage.getItem(this.historyStorageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      sessionStorage.removeItem(this.historyStorageKey);
      return [];
    }
  }
}
