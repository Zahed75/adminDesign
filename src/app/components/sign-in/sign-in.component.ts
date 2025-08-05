// import { Component, inject, OnInit } from '@angular/core';
// import {Router, RouterLink} from '@angular/router';
// import { AuthService } from '../../../services/auth/auth.service';
// import { FormsModule } from '@angular/forms';
//
// @Component({
//   selector: 'app-sign-in',
//   imports: [FormsModule, RouterLink],
//   templateUrl: './sign-in.component.html',
//   styleUrls: ['./sign-in.component.css'],
// })
// export class SignInComponent implements OnInit {
//   loginData = {
//     email: '',
//     password: '',
//   };
//
//   authService = inject(AuthService);
//   router = inject(Router);
//
//   constructor() {}
//
//   ngOnInit(
//
//   ) {}
//
//
//
//   // sign-in.component.ts
//
//   onLogin() {
//     this.authService.signIn(this.loginData).subscribe(
//         (res: any) => {
//           if (res.access_token && res.refresh_token && res.role) {
//             // Store tokens and user data consistently
//             localStorage.setItem('token', res.access_token); // Changed from 'accessToken'
//             localStorage.setItem('refreshToken', res.refresh_token);
//             localStorage.setItem('userId', res.user_id.toString());
//             localStorage.setItem('role', res.role.trim().toUpperCase());
//
//
//             // Store complete user data
//             localStorage.setItem('user', JSON.stringify({
//               id: res.user_id,
//               role: res.role.trim().toUpperCase()
//             }));
//
//
//
//
//
//             // Redirect based on role
//             this.redirectUserBasedOnRole(res.role.trim().toUpperCase());
//           }
//         },
//         (err) => {
//           alert(err.error?.message || 'Login error');
//         }
//     );
//   }
//
//
//   redirectUserBasedOnRole(role: string) {
//     switch (role) {
//       case 'AD':
//         this.router.navigateByUrl('/app/dashboard');
//         break;
//       case 'CUS':
//         this.router.navigateByUrl('/app/dashboard');
//         break;
//       case 'DES':
//         this.router.navigateByUrl('/app/designer'); // Designers start on designer page
//         break;
//       case 'TM':
//         this.router.navigateByUrl('/app/team');
//         break;
//       default:
//         alert('Invalid role detected. Please contact support.');
//         this.router.navigateByUrl('/sign-in');
//     }
//   }
//
//
// }
//
//
//


import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-in',
  standalone: true,  // Add this if missing
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent {
  loginData = {
    email: '',
    password: '',
  };

  authService = inject(AuthService);
  router = inject(Router);

  onLogin() {
    console.log('Login attempt with:', this.loginData); // Debug log

    this.authService.signIn(this.loginData).subscribe({
      next: (res: any) => {
        console.log('Login response:', res); // Debug log

        if (res.access_token && res.refresh_token) {
          // Store tokens
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('refreshToken', res.refresh_token);

          // Store basic user data - keep your existing structure
          const userData = {
            id: res.user_id || res.id,
            role: res.role || res.user_type || 'CUS' // Fallback to customer

          };
          localStorage.setItem('user', JSON.stringify({
            id: res.user_id,  // This must be the User model ID
            role: res.role || res.user_type,
            name: res.name || ''
          }));

          // Redirect - keep your existing logic
          this.redirectUserBasedOnRole(userData.role);
        } else {
          alert('Invalid response from server');
        }
      },
      error: (err) => {
        console.error('Login error:', err); // Debug log
        alert(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }

  // Keep your existing redirectUserBasedOnRole method
  redirectUserBasedOnRole(role: string) {
    role = role.toUpperCase();
    switch (role) {
      case 'AD':
        this.router.navigateByUrl('/app/dashboard');
        break;
      case 'CUS':
        this.router.navigateByUrl('/app/dashboard');
        break;
      case 'DES':
        this.router.navigateByUrl('/app/designer');
        break;
      case 'TM':
        this.router.navigateByUrl('/app/team');
        break;
      default:
        alert('Invalid role detected');
        this.router.navigateByUrl('/sign-in');
    }
  }
}