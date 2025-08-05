import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../enviornments/enviornment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
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

  getAllBrands(): Observable<any> {
    return this.http.get(`${this.baseURL}/brands/api/get-brandsList`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }


  createBrand(formData: FormData): Observable<any> {

    const headers = this.getAuthHeaders();
    headers.delete('Content-Type');

    return this.http.post(`${this.baseURL}/brands/api/addBrand`, formData, {
      headers: headers
    }).pipe(
        catchError(this.handleError)
    );
  }

  updateBrand(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.baseURL}/brands/api/updateBrand/${id}`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }

  deleteBrand(id: number): Observable<any> {
    return this.http.delete(`${this.baseURL}/brands/api/deleteBrand/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
        catchError(this.handleError)
    );
  }


  getBrandsByUser(): Observable<any> {
    return this.http.get(`${this.baseURL}/brands/api/brands/user/`, {
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