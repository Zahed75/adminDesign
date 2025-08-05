import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../enviornments/enviornment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private baseURL = environment.apiBaseUrl;

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

  inviteTeamMember(email: string, name: string, role: string): Observable<any> {
    return this.http.post(`${this.baseURL}/users/api/team-members/create/`,
        { email, name, user_type: role },
        { headers: this.getAuthHeaders() }
    ).pipe(
        catchError(this.handleError)
    );
  }

  updateTeamMember(id: number, email: string, name: string, role: string): Observable<any> {
    return this.http.put(`${this.baseURL}/users/api/team-members/${id}/update/`,
        { email, name, user_type: role },
        { headers: this.getAuthHeaders() }
    ).pipe(
        catchError(this.handleError)
    );
  }

  deleteTeamMember(id: number): Observable<any> {
    return this.http.delete(`${this.baseURL}/users/api/team-members/${id}/delete/`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  getTeamMembers(): Observable<any> {
    return this.http.get(`${this.baseURL}/users/api/team-members/`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}
