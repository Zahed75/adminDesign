import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';


@Component({
  selector: 'app-forget-pass',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-pass.component.html',
  styleUrls: ['./forget-pass.component.css']
})
export class ForgetPassComponent {
  email = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = null;
    this.success = null;

    const email = this.email.trim();
    if (!email) {
      this.error = 'Please enter your email address.';
      return;
    }

    this.loading = true;
    this.auth.requestPasswordReset(email).subscribe({
      next: () => {
        // Store the email for the next steps
        localStorage.setItem('reset_email', email);
        this.success = 'If the email exists, an OTP has been sent.';
        this.loading = false;

        // Navigate to OTP verification screen (you already have this)
        this.router.navigate(['/otp-verification'], { queryParams: { email } });
      },
      error: (err) => {
        this.loading = false;
        // Backend intentionally hides existence; still show generic message
        this.error = err?.error?.detail || 'Unable to request password reset right now.';
      }
    });
  }

  cancel() {
    this.router.navigate(['/sign-in']);
  }
}
