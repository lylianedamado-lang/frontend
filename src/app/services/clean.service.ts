import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CleanService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 📊 STATISTIQUES AVANT
  analyzeFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.apiUrl}/statavant`,
      formData,
      { withCredentials: true }
    );
  }

  // 🧹 CLEAN
  cleanFile(file: File, normalize: boolean, method?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('normalize', String(normalize));

    if (normalize && method) {
      formData.append('method', method);
    }

    return this.http.post<any>(
      `${this.apiUrl}/clean`,
      formData,
      { withCredentials: true }
    );
  }

  // ⬇ DOWNLOAD
  downloadFile(downloadUrl: string) {
    return this.http.get(
      `${this.apiUrl}${downloadUrl}`,
      {
        responseType: 'blob',
        withCredentials: true
      }
    );
  }
}
