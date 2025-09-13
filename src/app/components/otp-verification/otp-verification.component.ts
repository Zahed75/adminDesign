import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent {
  otp: string[] = Array(4).fill('');
  email: string = '';
  isLoading = false;
  errorMessage: string | null = null;

  // resend state
  isResending = false;
  countdown = 30;                // cooldown seconds
  countdownInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Resolve email from multiple sources (state -> localStorage -> query param)
    const navEmail = this.router.getCurrentNavigation()?.extras.state?.['email'];
    const lsEmail  = localStorage.getItem('reset_email');
    const qpEmail  = this.route.snapshot.queryParamMap.get('email');

    this.email = (navEmail || lsEmail || qpEmail || '').trim();
    if (this.email) {
      localStorage.setItem('reset_email', this.email); // ensure it's available for reset-password step
    }

    // Start countdown timer
    this.startCountdown();
  }

  onOtpChange(index: number, event: any) {
    const value = event.target.value;

    // Auto-focus next input
    if (value.length === 1 && index < 3) {
      const nextInput = document.querySelector(`#otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    // Auto-focus previous input on backspace
    if (event.key === 'Backspace' && index > 0 && !value) {
      const prevInput = document.querySelector(`#otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  onSubmit() {
    const otpCode = this.otp.join('');

    if (otpCode.length !== 4) {
      this.errorMessage = 'Please enter a complete 4-digit code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.verifyOTP({ email: this.email, otp: otpCode }).subscribe({
      next: (res) => {
        this.isLoading = false;

        // (Optional) store tokens if your backend returns them
        if (res?.access_token) {
          localStorage.setItem('accessToken', res.access_token);
          localStorage.setItem('refreshToken', res.refresh_token);
          localStorage.setItem('userId', res.user_id?.toString() || '');
          localStorage.setItem('role', res.role || 'CUS');
        }

        // Navigate to reset password after verified
        this.router.navigate(['/reset-password']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Invalid verification code. Please try again.';
      }
    });
  }

  // ============= RESEND (uses forgot-password request API) =============
  resendOTP() {
    if (!this.email) {
      this.errorMessage = 'Missing email. Please go back and start from Forgot Password.';
      return;
    }
    if (this.countdown > 0 || this.isResending) return;

    this.isResending = true;
    this.errorMessage = null;

    // 🔗 Use the same endpoint as the Forgot Password page
    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.isResending = false;
        // restart cooldown
        this.countdown = 30;      // keep same value as top (or change to 60 if you prefer)
        this.startCountdown();
      },
      error: () => {
        this.isResending = false;
        this.errorMessage = 'Failed to resend OTP. Please try again.';
      }
    });
  }

  startCountdown() {
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.countdownInterval);
  }
}
