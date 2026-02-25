import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/login']);

  if (auth.currentUser) {
    return of(true);
  }

  return auth.checkAuth(true).pipe(
    take(1),
    map((user) => user ? true : loginUrl),
    catchError(() => of(auth.currentUser ? true : loginUrl))
  );
};
