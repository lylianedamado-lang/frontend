import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const waitForSessionLoad$ = authService.isLoading()
    ? authService.loading$.pipe(
      filter((isLoading) => !isLoading),
      take(1)
    )
    : authService.loading$.pipe(take(1));

  return waitForSessionLoad$.pipe(
    switchMap(() => authService.checkSession()),
    map((isAuthenticated) => (
      isAuthenticated ? true : router.createUrlTree(['/login'])
    ))
  );
};
