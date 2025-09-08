import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// ✅ PrimeNG NgModule API only (do NOT import standalone components here)
import { CardModule, Card } from 'primeng/card';
import { AvatarModule, Avatar } from 'primeng/avatar';
import { ButtonModule, ButtonDirective } from 'primeng/button';
import { InputTextModule, InputText } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { TagModule, Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { DialogModule, Dialog } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

import { MessageService, ConfirmationService } from 'primeng/api';


type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

interface PlanOption {
  id: string;
  name: string;
  priceMonthly: number;
  stripePriceId: string;
  features: string[];
}

interface InvoiceRow {
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceUrl?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  // 👇 Only NgModules + Angular modules here. No standalone components, no directives.
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
      ButtonDirective,
      Card,
      Avatar,
      InputText,

      Tag,
      Dialog,
      NgForOf,
      NgClass
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ProfileComponent {
  // ===== Mock user state (replace with your API data) =====
  user = signal({
    name: 'Zahed Hasan',
    email: 'zahed@example.com',
    phone: '+8801XXXXXXXXX',
    timezone: 'Asia/Dhaka',
    language: 'English',
    avatarUrl: '',
  });

  subscription = signal<{
    planId: string;
    status: SubscriptionStatus;
    renewsOn?: string;
    cancelAtPeriodEnd?: boolean;
    trialEndsOn?: string;
    usage?: { quota: number; used: number };
  }>({
    planId: 'pro',
    status: 'active',
    renewsOn: '2025-10-09',
    cancelAtPeriodEnd: false,
    usage: { quota: 100000, used: 46532 }
  });

  invoices = signal<InvoiceRow[]>([
    { date: '2025-09-01', description: 'Pro – Monthly', amount: 19, status: 'paid', invoiceUrl: 'https://billing.stripe.com/...' },
    { date: '2025-08-01', description: 'Pro – Monthly', amount: 19, status: 'paid', invoiceUrl: 'https://billing.stripe.com/...' },
    { date: '2025-07-01', description: 'Pro – Monthly', amount: 19, status: 'paid' }
  ]);

  plans: PlanOption[] = [
    {
      id: 'basic',
      name: 'Basic',
      priceMonthly: 9,
      stripePriceId: 'price_basic_monthly_xxx',
      features: ['Single user', '5 projects', 'Email support']
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: 19,
      stripePriceId: 'price_pro_monthly_xxx',
      features: ['Up to 3 users', 'Unlimited projects', 'Priority support', 'Advanced analytics']
    },
    {
      id: 'team',
      name: 'Team',
      priceMonthly: 49,
      stripePriceId: 'price_team_monthly_xxx',
      features: ['Up to 10 users', 'SSO', 'Team roles & permissions', 'Audit logs']
    }
  ];

  // ===== UI state =====
  profileForm!: FormGroup;
  tzOptions = [
    { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
    { label: 'Asia/Kolkata (GMT+5:30)', value: 'Asia/Kolkata' },
    { label: 'UTC', value: 'UTC' }
  ];
  langOptions = [{ label: 'English', value: 'English' }, { label: 'Bangla', value: 'Bangla' }];

  changePlanVisible = signal(false);
  selectedPlanId = signal<string | null>(null);

  // Derived
  currentPlan = computed(() => this.plans.find(p => p.id === this.subscription().planId)!);
  usagePct = computed(() => {
    const u = this.subscription().usage;
    if (!u) return 0;
    return Math.min(100, Math.round((u.used / u.quota) * 100));
  });

  // ✅ PrimeNG severity tokens: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
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
      default:
        return 'info';
    }
  });

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    const u = this.user();
    this.profileForm = this.fb.group({
      name: [u.name, [Validators.required, Validators.minLength(2)]],
      email: [{ value: u.email, disabled: true }],
      phone: [u.phone, [Validators.required]],
      timezone: [u.timezone, Validators.required],
      language: [u.language, Validators.required]
    });

    effect(() => {
      // reserved for syncing with external stores/services if needed
    });
  }

  // ===== Profile Actions =====
  onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.msg.add({ severity: 'warn', summary: 'Fix errors', detail: 'Please check the highlighted fields.' });
      return;
    }
    this.user.update(u => ({ ...u, ...this.profileForm.getRawValue() }));
    this.msg.add({ severity: 'success', summary: 'Profile updated', detail: 'Your changes have been saved.' });
  }

  // ===== Subscription Actions =====
  openChangePlan() {
    this.selectedPlanId.set(this.subscription().planId);
    this.changePlanVisible.set(true);
  }

  async onConfirmChangePlan() {
    if (!this.selectedPlanId()) return;
    const newPlanId = this.selectedPlanId()!;
    if (newPlanId === this.subscription().planId) {
      this.msg.add({ severity: 'info', summary: 'No change', detail: 'You are already on this plan.' });
      return;
    }

    // TODO: call your backend to update Stripe subscription price
    // await this.http.post('/api/billing/change-plan', { priceId: plan.stripePriceId }).toPromise();
    this.subscription.update(s => ({ ...s, planId: newPlanId }));
    this.changePlanVisible.set(false);
    this.msg.add({ severity: 'success', summary: 'Plan updated', detail: `Switched to ${this.plans.find(p => p.id === newPlanId)?.name}.` });
  }

  async onManageBillingPortal() {
    // TODO: fetch billing portal URL from backend and redirect
    // const { url } = await this.http.get<{url: string}>('/api/billing/portal').toPromise();
    // window.location.href = url;
    this.msg.add({ severity: 'info', summary: 'Billing portal', detail: 'Wire this to your backend endpoint.' });
  }

  onCancelSubscription() {
    this.confirm.confirm({
      message: 'Cancel subscription? You retain access until the end of the billing period.',
      header: 'Cancel subscription',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, cancel',
      rejectLabel: 'Keep plan',
      accept: async () => {
        // TODO: backend -> Stripe: set cancel_at_period_end = true
        this.subscription.update(s => ({ ...s, cancelAtPeriodEnd: true }));
        this.msg.add({ severity: 'success', summary: 'Cancellation scheduled', detail: 'Auto-renew is off.' });
      }
    });
  }

  onResumeSubscription() {
    // TODO: backend -> Stripe: set cancel_at_period_end = false
    this.subscription.update(s => ({ ...s, cancelAtPeriodEnd: false }));
    this.msg.add({ severity: 'success', summary: 'Resumed', detail: 'Auto-renew is on.' });
  }

  currency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}
