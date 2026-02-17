import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  // 🔐 LOGIN
  login(credentials: { email: string; password: string }) {
    return this.http.post<any>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.currentUserSubject.next(res.user);
      })
    );
  }

  // 📝 REGISTER
  register(data: { username: string; email: string; password: string }) {
    return this.http.post<any>(
      `${this.apiUrl}/auth/register`,
      data,
      { withCredentials: true }
    );
  }

  // 🚪 LOGOUT
  logout() {
    return this.http.post(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
      })
    );
  }

  // 🔍 CHECK SESSION
  loadUser() {
    this.http.get<any>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    ).subscribe({
      next: res => this.currentUserSubject.next(res.user),
      error: () => this.currentUserSubject.next(null)
    });
  }

  // ✅ AUTH CHECK
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
