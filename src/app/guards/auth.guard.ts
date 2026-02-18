import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const verifySession$ = authService.checkSession().pipe(
    map((isAuthenticated) => (
      isAuthenticated ? true : router.createUrlTree(['/login'])
    ))
  );

  if (!authService.isLoading()) {
    return verifySession$;
  }

  return authService.loading$.pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => {
      if (authService.isAuthenticated()) {
        return of(true);
      }
      return verifySession$;
    })
  );
};
