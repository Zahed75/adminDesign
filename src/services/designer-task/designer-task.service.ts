import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviornments/enviornment';

interface StatusUpdateResponse {
  data: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesignerTaskService {
  private baseURL = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllServiceRequests(): Observable<any> {
    return this.http.get(`${this.baseURL}/service/api/all-requests/`, {
      headers: this.getAuthHeaders()
    });
  }

  updateRequestStatus(requestId: number, status: string): Observable<StatusUpdateResponse> {
    return this.http.post<StatusUpdateResponse>(
        `${this.baseURL}/service/api/request-action/${requestId}/`,
        { status },
        { headers: this.getAuthHeaders() }
    );
  }

  getRequestDetails(requestId: number): Observable<any> {
    return this.http.get(
        `${this.baseURL}/service/api/designer/requests-details/${requestId}`,
        { headers: this.getAuthHeaders() }
    );
  }
}
