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

  cleanFile(file: File, normalize: boolean, method: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('normalize', normalize.toString());
    
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
    return `${this.apiUrl}${downloadPath}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue lors du traitement du fichier.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0: errorMessage = 'Impossible de se connecter au serveur.'; break;
        case 400: errorMessage = error.error?.error || 'Format de fichier non supporté ou données invalides.'; break;
        case 404: errorMessage = 'API non trouvée. Vérifiez l\'URL du backend.'; break;
        case 413: errorMessage = 'Le fichier est trop volumineux.'; break;
        case 500: errorMessage = error.error?.error || 'Erreur serveur interne.'; break;
        default: errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}