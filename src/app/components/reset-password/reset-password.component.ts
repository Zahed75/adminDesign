import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  email: string | null = null;
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Preferred: use saved email from forgot-password step
    this.email = localStorage.getItem('reset_email');

    // Fallback to query param if present
    if (!this.email) {
      const qpEmail = this.route.snapshot.queryParamMap.get('email');
      if (qpEmail) {
        this.email = qpEmail;
        localStorage.setItem('reset_email', qpEmail);
      }
    }
  }

  toggleVisibility() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    this.error = null;
    this.success = null;

    const email = (this.email || '').trim();
    if (!email) {
      this.error = 'Missing email for reset. Please start from Forgot Password.';
      return;
    }
    if (!this.newPassword.trim()) {
      this.error = 'Please enter a new password.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.auth.resetPasswordByEmail({
      email,
      new_password: this.newPassword,
      confirm_password: this.confirmPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = 'Password has been reset successfully.';
        // Clear the stored email after success
        localStorage.removeItem('reset_email');

        // Navigate to sign-in after a brief pause
        setTimeout(() => this.router.navigate(['/sign-in']), 800);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Unable to reset password.';
      }
    });
  }

  cancel() {
    this.router.navigate(['/sign-in']);
  }
}
