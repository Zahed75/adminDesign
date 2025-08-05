import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    authService.redirectUrl = state.url;
    router.navigate(['/sign-in']);
    return false;
  }

  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  const userRole = authService.getCurrentRole();

  if (!requiredRoles) return true;

  if (!userRole || !requiredRoles.includes(userRole)) {
    router.navigate(['/notfound']);
    return false;
  }

  return true;
};