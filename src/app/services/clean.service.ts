import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CleanService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  cleanFile(file: File, normalize: boolean, method?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('normalize', String(normalize));

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    formData.append('file_type', fileExtension || '');
    
    if (normalize && method) {
      formData.append('method', method);
    }

    return this.http.post<any>(`${this.apiUrl}/clean`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue lors du traitement du fichier.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Format de fichier non supporté ou données invalides.';
          break;
        case 413:
          errorMessage = 'Le fichier est trop volumineux. Taille maximale: 10MB.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Service Error:', errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
}