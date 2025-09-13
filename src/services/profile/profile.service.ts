// profile.service.ts - UPDATED WITH AUTH HEADERS
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../enviornments/enviornment';

export interface SubscriptionStatusResponse {
  message: string;
  data: {
    id: number;
    customer: {
      id: number;
      name: string;
      email: string;
      user_type: string;
    };
    tier: {
      id: number;
      name: string;
      price: string;
      features: string[];
      interval: string;
      stripe_product_id: string;
      stripe_price_id: string;
    };
    stripe_subscription_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
    payment_transaction_id: string;
  };
}

export interface PricingTier {
  id: number;
  name: string;
  price: string;
  features: string[];
  interval: string;
  stripe_product_id: string;
  stripe_price_id: string;
}

export interface PricingTierResponse {
  code: number;
  message: string;
  data: PricingTier[];
}

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
  user_type?: string;
}

export interface BillingPortalResponse {
  url: string;
  error?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  invoiceUrl?: string;
}

export interface ChangeSubscriptionRequest {
  tier_id: number;
}

export interface ChangeSubscriptionResponse {
  message: string;
}

export interface CancelSubscriptionResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  // Get subscription status
  getSubscriptionStatus(email: string): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(
      `${this.apiUrl}/subscribe/api/subscription/status?email=${encodeURIComponent(email)}`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Get pricing tiers
  getPricingTiers(): Observable<PricingTierResponse> {
    return this.http.get<PricingTierResponse>(
      `${this.apiUrl}/pricingTier/api/get-pricingTierList`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Change subscription tier
  changeSubscriptionTier(tierId: number): Observable<ChangeSubscriptionResponse> {
    return this.http.post<ChangeSubscriptionResponse>(
      `${this.apiUrl}/subscribe/api/change-subscription-tier`,
      { tier_id: tierId },
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Cancel subscription
  cancelSubscription(): Observable<CancelSubscriptionResponse> {
    return this.http.post<CancelSubscriptionResponse>(
      `${this.apiUrl}/subscribe/api/cancel-subscription`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Get user profile - WITH AUTH HEADER
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.apiUrl}/users/api/user/profile/`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Update user profile - WITH AUTH HEADER
  updateUserProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(
      `${this.apiUrl}/users/api/user/profile/`,
      profile,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Get billing portal URL - WITH AUTH HEADER
  getBillingPortalUrl(): Observable<BillingPortalResponse> {
    return this.http.get<BillingPortalResponse>(
      `${this.apiUrl}/subscribe/api/billing/portal/`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Get invoices - WITH AUTH HEADER
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(
      `${this.apiUrl}/subscribe/api/billing/invoices/`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }
}