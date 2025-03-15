import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  constructor(
    private   readonly  http: HttpClient,
    private  readonly  router: Router,
    private  readonly  toastr: ToastrService
  ) {}

  protected get<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(url, { params }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected delete<T>(url: string, body?: any): Observable<T> {
    return this.http.request<T>('DELETE', url, { body }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected deleteWithParams<T>(url: string, params: any): Observable<T> {
    return this.http.request<T>('DELETE', url, {
      params,
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/auth/sign-in']);
        }
        return throwError(() => new Error(error.message || 'An unexpected error occurred'));
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Server error';

    if (error.status === 401) {
      // Unauthorized error - handle token expiration
      errorMessage = 'Your session has expired. Please log in again.';
      this.router.navigate(['/auth/sign-in']);
    } else if (error.status === 500) {
      // Internal Server Error
      errorMessage = 'An unexpected error occurred on the server.';
    } else if (error?.error) {
   
   
      errorMessage = error.error;
    }
    return throwError(() => errorMessage);
  }
}
