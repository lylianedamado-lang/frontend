import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  of,
  map,
  switchMap,
  throwError,
  finalize,
  shareReplay
} from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private checkAuthRequest$?: Observable<User | null>;
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get isLoggedIn(): boolean { return this.currentUserSubject.value !== null; }
  get currentUser(): User | null { return this.currentUserSubject.value; }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data, { withCredentials: true });
  }

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, data, { withCredentials: true }).pipe(
      switchMap(() => this.checkAuth(true))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentUserSubject.next(null)),
      catchError((error) => {
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  checkAuth(forceRefresh: boolean = false): Observable<User | null> {
    if (!forceRefresh && this.currentUserSubject.value) {
      return of(this.currentUserSubject.value);
    }
    if (this.checkAuthRequest$) {
      return this.checkAuthRequest$;
    }

    this.checkAuthRequest$ = this.http.get<{ user?: User } | User>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      map((res) => (res as { user?: User }).user ?? (res as User)),
      tap((user) => this.currentUserSubject.next(user ?? null)),
      catchError((error: unknown) => {
        if (this.isAuthMissing(error)) {
          this.currentUserSubject.next(null);
          return of(null);
        }
        return throwError(() => error);
      }),
      finalize(() => { this.checkAuthRequest$ = undefined; }),
      shareReplay(1)
    );

    return this.checkAuthRequest$;
  }

  private isAuthMissing(error: unknown): boolean {
    return error instanceof HttpErrorResponse && [401, 403, 404].includes(error.status);
  }
}
