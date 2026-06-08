import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HelloResponse, InfoResponse } from '../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class HelloWorldService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** GET /api/v1/hello */
  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>(`${this.base}/hello`).pipe(
      catchError(this.handleError)
    );
  }

  /** GET /api/v1/hello/:name */
  getHelloName(name: string): Observable<HelloResponse> {
    return this.http.get<HelloResponse>(`${this.base}/hello/${encodeURIComponent(name)}`).pipe(
      catchError(this.handleError)
    );
  }

  /** POST /api/v1/hello */
  postHello(name: string): Observable<HelloResponse> {
    return this.http.post<HelloResponse>(`${this.base}/hello`, { name }).pipe(
      catchError(this.handleError)
    );
  }

  /** GET /api/v1/info */
  getInfo(): Observable<InfoResponse> {
    return this.http.get<InfoResponse>(`${this.base}/info`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.message ?? err.message ?? 'Unknown error';
    return throwError(() => new Error(`API error ${err.status}: ${message}`));
  }
}
