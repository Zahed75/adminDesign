// sign-in.component.ts - FIXED VERSION
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-in',
  standalone: true,
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
    console.log('Login attempt with:', this.loginData);

    // Use the fixed signIn method from AuthService
    this.authService.signIn(this.loginData).subscribe({
      next: (res: any) => {
        console.log('Login response:', res);

        if (res.access_token && res.refresh_token) {
          // Store tokens
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('refreshToken', res.refresh_token);

          // Store complete user data including email
          const userData = {
            id: res.user_id || res.id,
            role: res.role || res.user_type || 'CUS',
            name: res.name || '',
            email: this.loginData.email // Store the email from login
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ User data stored:', userData);

          // Redirect
          this.redirectUserBasedOnRole(userData.role);
        } else {
          alert('Invalid response from server');
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        alert(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }

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