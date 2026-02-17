import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

getHistory() {
  return this.http.get<any>(
    `${environment.apiUrl}/history`,
    { withCredentials: true }
  );
}

}
