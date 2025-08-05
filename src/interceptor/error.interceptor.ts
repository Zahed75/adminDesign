import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LayoutService } from '../app/layout/service/layout.service'; // Correct path

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const layoutService = inject(LayoutService); // Correct service name

  return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const isContinue = confirm(
              'Your session has expired. Do you want to login again?'
          );
          if (isContinue) {
            // Add this subject to LayoutService if it doesn't exist
            layoutService.reset(); // Assuming reset() is used to handle session expiry
          }
        }
        return throwError(() => error);
      })
  );
};
