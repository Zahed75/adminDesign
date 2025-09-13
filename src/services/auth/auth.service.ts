import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../enviornments/enviornment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseURL = `${environment.apiBaseUrl}/users`; // Base API URL
  private http = inject(HttpClient);
  redirectUrl: string | null = null;





 // In your login component or auth service - UPDATE LOGIN HANDLING
// In your login component or auth service - FIX LOGIN STORAGE
signIn(loginData: { email: string; password: string }): Observable<any> {
  return this.http.post(`${this.baseURL}/api/token/`, {
    email: loginData.email,
    password: loginData.password,
  }).pipe(
    tap((response: any) => {
      // Store the complete user data including email
      const userData = {
        id: response.user_id,
        role: response.role,
        name: response.name,
        email: loginData.email // MAKE SURE THIS IS INCLUDED
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.access_token);
      
      console.log('✅ User data stored in localStorage:', userData);
    })
  );
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

   // Add this method to get current user email
// In auth.service.ts - FIXED getCurrentUserEmail METHOD
// In auth.service.ts - FIX THE getCurrentUserEmail METHOD
getCurrentUserEmail(): string | null {
  console.log('🔍 Getting user email from localStorage...');
  
  // Check if user data is stored in localStorage
  const userData = localStorage.getItem('user');
  console.log('📦 User data from localStorage:', userData);
  
  if (!userData) {
    console.log('❌ No user data found in localStorage');
    return null;
  }
  
  try {
    const user = JSON.parse(userData);
    console.log('👤 Parsed user object:', user);
    
    // Check if email exists in user object
    if (user.email) {
      console.log('✅ Found email in user object:', user.email);
      return user.email;
    }
    
    console.log('❌ No email found in user object');
    return null;
    
  } catch (parseError) {
    console.error('Error parsing user data:', parseError);
    return null;
  }
}
}