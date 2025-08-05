import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../enviornments/enviornment';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
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

  // Get all brands (including user's brands)
  getAllBrands(): Observable<any> {
    return this.http.get(`${this.baseURL}/brands/api/get-brandsList`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  // Get only user's brands
  getUserBrands(): Observable<any> {
    return this.http.get(`${this.baseURL}/brands/api/brands/user/`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  // Get all categories
  getAllCategories(): Observable<any> {
    return this.http.get(`${this.baseURL}/category/api/get-all-cat/`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  // Get all products
  getAllProducts(): Observable<any> {
    return this.http.get(`${this.baseURL}/product/api/all-products/`, {

    }).pipe(
        catchError(this.handleError)
    );
  }

  // Create service request
  createServiceRequest(serviceData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    headers.delete('Content-Type'); // Let browser set content-type for FormData

    return this.http.post(`${this.baseURL}/service/api/create-service/`, serviceData, {
      headers: headers
    }).pipe(
        catchError(this.handleError)
    );
  }


  getServicesByUser(): Observable<any> {
    return this.http.get(`${this.baseURL}/service/api/get-service-by-user/`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  // Add this method to your RequestService class in request.service.ts

  getServiceDetailsById(serviceId: number): Observable<any> {
    return this.http.get(`${this.baseURL}/service/api/request/${serviceId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }


  // Add these methods to your RequestService

// Update service request
  updateServiceRequest(serviceId: number, updateData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.baseURL}/service/api/update-request/${serviceId}`, updateData, {
      headers: headers
    }).pipe(
        catchError(this.handleError)
    );
  }

// Delete service request
  deleteServiceRequest(serviceId: number): Observable<any> {
    return this.http.delete(`${this.baseURL}/service/api/delete-request/${serviceId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }



  // Add these methods to your RequestService class

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}