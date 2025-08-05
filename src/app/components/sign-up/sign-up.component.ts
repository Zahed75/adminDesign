import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showSuccessLoader = false; // New loader state

  constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]],
      terms: [false, Validators.requiredTrue]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.showSuccessLoader = false;

    const { username, email, password } = this.registerForm.value;

    this.authService.register({
      username,
      email,
      password,
      user_type: 'CUS'
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showSuccessLoader = true;

        // Show success loader for 2 seconds before redirecting
        setTimeout(() => {
          this.router.navigate(['/otp-verification'], {
            state: { email: email, from: 'signup' }
          });
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.showSuccessLoader = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  get f() { return this.registerForm.controls; }
}