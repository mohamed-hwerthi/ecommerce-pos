import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/invoice`;

  constructor(private readonly http: HttpClient) {}

  downloadInvoice(orderId: string): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}`;
    const headers = new HttpHeaders({
      Accept: 'application/pdf',
    });

    return this.http.get(url, {
      headers,
      responseType: 'blob',
    });
  }
}
