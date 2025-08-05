import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviornments/enviornment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseURL = `${environment.apiBaseUrl}/users`; // Base API URL
  private http = inject(HttpClient);
  redirectUrl: string | null = null;





  signIn(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseURL}/api/token/`, {  // Changed from verify to token
      email: loginData.email,
      password: loginData.password,
    });
  }



  register(userData: { username: string; email: string; password: string; user_type: string; }): Observable<any> {
    return this.http.post(`${this.baseURL}/api/register/`, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      user_type: userData.user_type || 'CUS' // Default to customer if not specified
    });
  }




  verifyOTP(otpData: {
    email: string;
    otp: string;
  }): Observable<any> {
    return this.http.post(`${this.baseURL}/api/OtpVerify/`, otpData);
  }

  resendOTP(email: string): Observable<any> {
    return this.http.post(`${this.baseURL}/api/resend-otp/`, { email });
  }


  verifyToken(token: string): Observable<any> {
    return this.http.post(`${this.baseURL}/token/`, { token });
  }






  getRole(): string | null {
    const user = localStorage.getItem('users');
    return user ? JSON.parse(user).role : null;
  }




  isLoggedIn(): boolean {
    return !!localStorage.getItem('token'); // Consistent with what we stored
  }

  getCurrentRole(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token'); // Consistent with what we stored
  }


  hasPermission(action: string): boolean {
    const role = this.getRole();
    // Replace RolePermissions with your permissions logic
    const RolePermissions: any = {
      AD: ['ALL'],
      CUS: ['VIEW_DASHBOARD'],
      DES: ['VIEW_DESIGNER'],
    };

    if (!role || !(role in RolePermissions)) {
      return false;
    }

    const permissions = RolePermissions[role as keyof typeof RolePermissions];
    return permissions.includes(action);
  }


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Add this helper method to check if user is customer
  isCustomer(): boolean {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role === 'CUS' : false;
  }

  // Add this helper method to check if user is designer
  isDesigner(): boolean {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role === 'DES' : false;
  }




}


