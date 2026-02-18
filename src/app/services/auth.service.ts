import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, retry, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthUser {
  username?: string;
  email?: string;
}

interface AuthResponse {
  user: AuthUser | null;
}

interface RegisterResponse {
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private sessionCheckInFlight$: Observable<boolean> | null = null;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // Nouveau subject pour indiquer si la session est en cours de chargement
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    const cachedUser = sessionStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        this.persistUser(JSON.parse(cachedUser) as AuthUser);
      } catch {
        sessionStorage.removeItem('currentUser');
      }
    }
    this.loadUser();
  }

  // 🔐 LOGIN
  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.persistUser(res.user);
      })
    );
  }

  // 📝 REGISTER
  register(data: { username: string; email: string; password: string }) {
    return this.http.post<RegisterResponse>(
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
        this.persistUser(null);
      })
    );
  }

  // 🔍 CHECK SESSION
  loadUser() {
    this.checkSession().subscribe({
      next: () => this.loadingSubject.next(false),
      error: () => this.loadingSubject.next(false)
    });
  }

  checkSession() {
    if (this.sessionCheckInFlight$) {
      return this.sessionCheckInFlight$;
    }

    const request$ = this.http.get<AuthResponse>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      retry({ count: 1, delay: 250 }),
      map(res => {
        this.persistUser(res.user);
        return !!res.user;
      }),
      catchError(() => {
        this.persistUser(null);
        return of(false);
      }),
      finalize(() => {
        this.sessionCheckInFlight$ = null;
      }),
      shareReplay(1)
    );

    this.sessionCheckInFlight$ = request$;
    return request$;
  }

  // ✅ AUTH CHECK (synchrone)
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  private persistUser(user: AuthUser | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }
}
