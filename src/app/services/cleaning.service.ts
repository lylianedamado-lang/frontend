import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CleaningResult, HistoryItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CleaningService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  cleanFile(file: File, normalize: boolean = false, method: string = ''): Observable<CleaningResult> {
    const fd = new FormData();
    fd.append('file', file);
    if (normalize) {
      fd.append('normalize', 'true');
      if (method) fd.append('method', method);
    }
    return this.http.post<CleaningResult>(`${this.apiUrl}/clean`, fd, { withCredentials: true });
  }

  downloadFile(fileId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/download/${fileId}`,
      {
        withCredentials: true,
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

  getHistory(): Observable<HistoryItem[]> {
    return this.http.get<any>(`${this.apiUrl}/history`, { withCredentials: true }).pipe(
      map(res => res.history || res)
    );
  }

  getFilenameFromResponse(response: HttpResponse<Blob>, fallbackName: string): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (!contentDisposition) {
      return fallbackName;
    }

    const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1]);
      } catch {
        return utfMatch[1];
      }
    }

    const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return basicMatch?.[1] || fallbackName;
  }
}
