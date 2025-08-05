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
  isResending = false;
  countdown = 30;
  countdownInterval: any;

  constructor(
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
  ) {
    // Get email from route state
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras.state?.['email'] || 'your@email.com';

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

    this.authService.verifyOTP({
      email: this.email,
      otp: otpCode
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Store tokens if available
        if (res.access_token) {
          localStorage.setItem('accessToken', res.access_token);
          localStorage.setItem('refreshToken', res.refresh_token);
          localStorage.setItem('userId', res.user_id?.toString() || '');
          localStorage.setItem('role', res.role || 'CUS');
        }
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid verification code. Please try again.';
      }
    });
  }

  resendOTP() {
    this.isResending = true;
    this.authService.resendOTP(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.countdown = 30;
        this.startCountdown();
      },
      error: (err) => {
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