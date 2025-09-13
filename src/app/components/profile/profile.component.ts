// profile.component.ts - COMPLETE FIXED VERSION
import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule, NgForOf, NgClass, NgIf, TitleCasePipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';

// PrimeNG modules
import { CardModule, Card } from 'primeng/card';
import { AvatarModule, Avatar } from 'primeng/avatar';
import { ButtonModule, ButtonDirective } from 'primeng/button';
import { InputTextModule, InputText } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { TagModule, Tag } from 'primeng/tag';
import { ToastModule, Toast } from 'primeng/toast';
import { ConfirmDialogModule, ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { DialogModule, Dialog } from 'primeng/dialog';
import { ProgressBarModule, ProgressBar } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { ProgressSpinnerModule, ProgressSpinner } from 'primeng/progressspinner';

import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../services/auth/auth.service';
import { ProfileService, SubscriptionStatusResponse, PricingTier, UserProfile, PricingTierResponse, BillingPortalResponse, Invoice } from '../../../services/profile/profile.service';


type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none';

interface InvoiceRow {
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';
  invoiceUrl?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    AvatarModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DividerModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    DialogModule,
    ProgressBarModule,
    TooltipModule,
    RippleModule,
    ProgressSpinnerModule,
    NgForOf,
    NgClass,
    NgIf,
    TitleCasePipe,
    DatePipe,
      ButtonDirective,
      ProgressSpinner,
      Toast,
      ConfirmDialog,
      Card,
      Avatar,
      InputText,
      Tag,
      ProgressBar,
      Dialog
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  // ===== User state =====
  user = signal<UserProfile>({
    name: '',
    email: '',
    phone: '',
    timezone: 'Asia/Dhaka',
    language: 'English',
    avatarUrl: '',
  });

  subscription = signal<{
    tierId: number;
    tierName: string;
    status: SubscriptionStatus;
    renewsOn?: string;
    cancelAtPeriodEnd?: boolean;
    trialEndsOn?: string;
    usage?: { quota: number; used: number };
    stripeSubscriptionId?: string;
    hasSubscription: boolean;
  }>({
    tierId: 0,
    tierName: '',
    status: 'none',
    cancelAtPeriodEnd: false,
    hasSubscription: false
  });

  invoices = signal<InvoiceRow[]>([]);
  pricingTiers = signal<PricingTier[]>([]);
  isLoading = signal(false);
  hasSubscriptionData = signal(false);
  hasBillingData = signal(false);

  // ===== UI state =====
  profileForm!: FormGroup;
  tzOptions = [
    { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
    { label: 'Asia/Kolkata (GMT+5:30)', value: 'Asia/Kolkata' },
    { label: 'UTC', value: 'UTC' }
  ];
  langOptions = [{ label: 'English', value: 'English' }, { label: 'Bangla', value: 'Bangla' }];

  changePlanVisible = signal(false);
  selectedTierId = signal<number | null>(null);

  // Derived signals
  currentPlan = computed(() => {
    const tierId = this.subscription().tierId;
    const foundTier = this.pricingTiers().find(t => t.id === tierId);
    
    console.log('Current plan computation - Looking for tier ID:', tierId, 'Available tiers:', this.pricingTiers());
    console.log('Found tier:', foundTier);
    
    if (foundTier) {
      return {
        name: foundTier.name,
        priceMonthly: parseFloat(foundTier.price),
        features: foundTier.features,
        interval: foundTier.interval
      };
    }
    
    // If no tier found but we have subscription data, create a temporary plan
    if (this.subscription().hasSubscription && this.subscription().tierName) {
      return {
        name: this.subscription().tierName,
        priceMonthly: 100.00, // Default price from your API response
        features: ['Active subscription'],
        interval: 'month'
      };
    }
    
    return { 
      name: 'No Active Plan', 
      priceMonthly: 0.00, 
      features: ['No subscription active'], 
      interval: 'month'
    };
  });

  usagePct = computed(() => {
    const u = this.subscription().usage;
    if (!u) return 0;
    return Math.min(100, Math.round((u.used / u.quota) * 100));
  });

  statusSeverity = computed<'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'>(() => {
    switch (this.subscription().status) {
      case 'active':
      case 'trialing':
        return 'success';
      case 'past_due':
      case 'incomplete':
        return 'warn';
      case 'canceled':
        return 'danger';
      case 'none':
      default:
        return 'secondary';
    }
  });

// In profile.component.ts - FIX THE ERROR
ngOnInit(): void {
  console.log('🔄 ProfileComponent initialized');
  
  // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
  setTimeout(() => {
    // Check localStorage contents
    console.log('📦 LocalStorage contents:');
    console.log('   - token:', localStorage.getItem('token'));
    console.log('   - user:', localStorage.getItem('user'));
    
    // DIRECT FIX: Ensure email is available
    this.ensureEmailAvailable();
    
    this.initializeForm();
    this.loadData();
  });
}

private ensureEmailAvailable(): void {
  const userData = localStorage.getItem('user');
  if (!userData) return;
  
  try {
    const user = JSON.parse(userData);
    
    // If email is missing, try to get it from various sources
    if (!user.email) {
      console.log('⚠️ Email missing from user object, trying to recover...');
      
      // 1. Check if we have a separate email storage
      const separateEmail = localStorage.getItem('user_email');
      if (separateEmail) {
        user.email = separateEmail;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Recovered email from separate storage:', separateEmail);
        return;
      }
      
      // 2. Check if we can extract from token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.email) {
            user.email = payload.email;
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ Recovered email from token:', payload.email);
            return;
          }
        } catch (tokenError) {
          console.error('Error extracting email from token:', tokenError);
        }
      }
      
      // 3. Last resort: prompt user or use a default
      console.log('❌ Could not recover email automatically');
    }
  } catch (error) {
    console.error('Error ensuring email availability:', error);
  }
}

// Add this method to get email from login
private getEmailFromLogin(): string | null {
  // Check if we stored login email separately
  const loginEmail = localStorage.getItem('login_email');
  if (loginEmail) {
    return loginEmail;
  }
  
  // Or extract from token if possible
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) {
        return payload.email;
      }
    } catch (error) {
      console.error('Error extracting email from token:', error);
    }
  }
  
  return null;
}

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.required]],
      timezone: ['Asia/Dhaka', Validators.required],
      language: ['English', Validators.required]
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    // Get user email first
    const userEmail = this.authService.getCurrentUserEmail();
    console.log('Loading data for user email:', userEmail);

    if (!userEmail) {
      console.error('No user email found!');
      this.isLoading.set(false);
      return;
    }

    // Load subscription status FIRST - this is the critical API call
    console.log('Calling subscription status API...');
    this.profileService.getSubscriptionStatus(userEmail).pipe(
      tap((response: SubscriptionStatusResponse) => {
        console.log('✅ Subscription API response received:', response);
        this.updateSubscriptionFromResponse(response);
        this.hasSubscriptionData.set(true);
      }),
      catchError(error => {
        console.error('❌ Subscription status error:', error);
        this.hasSubscriptionData.set(false);
        return of(null);
      })
    ).subscribe();

    // Load user profile
    this.profileService.getUserProfile().pipe(
      tap((user: UserProfile) => {
        console.log('User profile loaded:', user);
        const userData = {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          timezone: user.timezone || 'Asia/Dhaka',
          language: user.language || 'English',
          avatarUrl: user.avatarUrl || ''
        };
        this.user.set(userData);
        this.profileForm.patchValue(userData);
      }),
      catchError(error => {
        console.error('Profile load error:', error);
        return of(null);
      })
    ).subscribe();

    // Load pricing tiers
    this.profileService.getPricingTiers().pipe(
      tap((response: PricingTierResponse) => {
        console.log('Pricing tiers loaded:', response.data);
        this.pricingTiers.set(response.data);
      }),
      catchError(error => {
        console.error('Pricing tiers error:', error);
        return of(null);
      })
    ).subscribe();

    // Load invoices
    this.profileService.getInvoices().pipe(
      tap((invoices: Invoice[]) => {
        console.log('Invoices loaded:', invoices);
        const formattedInvoices: InvoiceRow[] = invoices.map((inv: Invoice) => ({
          date: this.formatDate(inv.date),
          description: inv.description,
          amount: inv.amount,
          status: inv.status as 'paid' | 'open' | 'void' | 'uncollectible' | 'draft',
          invoiceUrl: inv.invoiceUrl
        }));
        this.invoices.set(formattedInvoices);
        this.hasBillingData.set(invoices.length > 0);
      }),
      catchError(error => {
        console.error('Invoices error:', error);
        return of([]);
      }),
      finalize(() => {
        this.isLoading.set(false);
        console.log('✅ All data loading completed');
        console.log('Final subscription state:', this.subscription());
        console.log('Final current plan:', this.currentPlan());
      })
    ).subscribe();
  }

  private formatDate(dateInput: string | number): string {
    try {
      let date: Date;
      
      if (typeof dateInput === 'number') {
        date = new Date(dateInput * 1000);
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else {
        return 'Invalid date';
      }
      
      return date.toISOString().split('T')[0];
    } catch {
      return 'Invalid date';
    }
  }

  private updateSubscriptionFromResponse(response: SubscriptionStatusResponse): void {
    try {
      const data = response.data;
      
      if (!data || !data.tier) {
        console.error('Invalid subscription data:', response);
        return;
      }
      
      let renewsOn: string | undefined;
      if (data.current_period_end) {
        try {
          const date = new Date(data.current_period_end);
          renewsOn = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch (dateError) {
          renewsOn = data.current_period_end;
        }
      }
      
      this.subscription.set({
        tierId: data.tier.id,
        tierName: data.tier.name,
        status: data.status as SubscriptionStatus,
        renewsOn: renewsOn,
        cancelAtPeriodEnd: data.canceled_at !== null,
        stripeSubscriptionId: data.stripe_subscription_id,
        usage: { quota: 100000, used: 46532 },
        hasSubscription: true
      });
      
      console.log('✅ Subscription successfully updated:', this.subscription());
      
    } catch (error) {
      console.error('Error updating subscription from response:', error, response);
    }
  }

  // ===== Profile Actions =====
  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.msg.add({ severity: 'warn', summary: 'Fix errors', detail: 'Please check the highlighted fields.' });
      return;
    }

    this.isLoading.set(true);
    const profileData = this.profileForm.getRawValue();
    
    this.profileService.updateUserProfile(profileData).pipe(
      tap((updatedProfile: UserProfile) => {
        this.user.set(updatedProfile);
        this.msg.add({ severity: 'success', summary: 'Profile updated', detail: 'Your changes have been saved.' });
      }),
      catchError(error => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  // ===== Subscription Actions =====
  openChangePlan(): void {
    if (!this.subscription().hasSubscription) {
      this.msg.add({ severity: 'info', summary: 'No Subscription', detail: 'You need an active subscription to change plans.' });
      return;
    }
    this.selectedTierId.set(this.subscription().tierId);
    this.changePlanVisible.set(true);
  }

  onConfirmChangePlan(): void {
    if (!this.selectedTierId()) return;
    
    const newTierId = this.selectedTierId()!;
    const newTier = this.pricingTiers().find(t => t.id === newTierId);
    
    if (!newTier || newTierId === this.subscription().tierId) {
      this.msg.add({ severity: 'info', summary: 'No change', detail: 'You are already on this tier.' });
      return;
    }

    this.isLoading.set(true);
    this.profileService.changeSubscriptionTier(newTierId).pipe(
      tap(() => {
        this.subscription.update(s => ({ 
          ...s, 
          tierId: newTierId,
          tierName: newTier.name 
        }));
        this.changePlanVisible.set(false);
        this.msg.add({ severity: 'success', summary: 'Plan updated', detail: `Switched to ${newTier.name}.` });
      }),
      catchError(error => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to change plan' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  onManageBillingPortal(): void {
    this.isLoading.set(true);
    this.profileService.getBillingPortalUrl().pipe(
      tap((response: BillingPortalResponse) => {
        if (response && 'error' in response && response.error) {
          this.msg.add({ severity: 'error', summary: 'Error', detail: response.error });
        } else if (response && response.url) {
          window.location.href = response.url;
        } else {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Invalid response from server' });
        }
      }),
      catchError(error => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to access billing portal' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  onCancelSubscription(): void {
    if (!this.subscription().hasSubscription) {
      this.msg.add({ severity: 'info', summary: 'No Subscription', detail: 'You don\'t have an active subscription to cancel.' });
      return;
    }

    this.confirm.confirm({
      message: 'Cancel subscription? You retain access until the end of the billing period.',
      header: 'Cancel subscription',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, cancel',
      rejectLabel: 'Keep plan',
      accept: () => {
        this.isLoading.set(true);
        this.profileService.cancelSubscription().pipe(
          tap(() => {
            this.subscription.update(s => ({ ...s, cancelAtPeriodEnd: true, status: 'canceled' }));
            this.msg.add({ severity: 'success', summary: 'Cancellation scheduled', detail: 'Auto-renew is off.' });
          }),
          catchError(error => {
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel subscription' });
            return of(null);
          }),
          finalize(() => this.isLoading.set(false))
        ).subscribe();
      }
    });
  }

  onResumeSubscription(): void {
    this.msg.add({ severity: 'info', summary: 'Info', detail: 'Resume functionality not implemented yet.' });
  }

  currency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount);
  }
}