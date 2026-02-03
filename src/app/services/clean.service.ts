import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CleanService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('CleanService initialisé avec API URL:', this.apiUrl);
  }

  analyzeFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('normalize', 'false');
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    formData.append('file_type', fileExtension || '');

    console.log(`Analyse du fichier: ${file.name} vers ${this.apiUrl}/clean`);
    
    return this.http.post<any>(`${this.apiUrl}/clean`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  cleanFile(file: File, normalize: boolean, method?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('normalize', String(normalize));

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    formData.append('file_type', fileExtension || '');
    
    if (normalize && method) {
      formData.append('method', method);
    }

    console.log(`Nettoyage du fichier: ${file.name}, normalize=${normalize}, method=${method}`);
    console.log(`URL: ${this.apiUrl}/clean`);
    
    return this.http.post<any>(`${this.apiUrl}/clean`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getDownloadUrl(downloadPath: string): string {
    if (downloadPath.startsWith('/')) {
      return `${this.apiUrl}${downloadPath}`;
    }
    return downloadPath;
  }

  downloadFile(downloadPath: string): void {
    const url = this.getDownloadUrl(downloadPath);
    console.log('Téléchargement depuis:', url);
    window.open(url, '_blank');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur API:', error);
    
    let errorMessage = 'Une erreur est survenue lors du traitement du fichier.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
          break;
        case 400:
          errorMessage = error.error?.error || 'Format de fichier non supporté ou données invalides.';
          break;
        case 404:
          errorMessage = 'API non trouvée. Vérifiez l\'URL du backend.';
          break;
        case 413:
          errorMessage = 'Le fichier est trop volumineux.';
          break;
        case 500:
          errorMessage = error.error?.error || 'Erreur serveur interne.';
          break;
        case 504:
          errorMessage = 'Timeout du serveur. Le fichier est peut-être trop volumineux ou le traitement trop long.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Service Error:', errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }

  testApiConnection(): Observable<any> {
    console.log('Test de connexion API:', this.apiUrl);
    return this.http.get(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }
}