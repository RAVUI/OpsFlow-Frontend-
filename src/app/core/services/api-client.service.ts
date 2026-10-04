import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {

  private readonly baseUrl =
    'https://localhost:7092/api';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET
  // =====================================================

  get<T>(
    endpoint: string,
    params?: HttpParams
  ): Observable<T> {

    return this.http.get<T>(
      `${this.baseUrl}/${endpoint}`,
      {
        params
      }
    );
  }


  // =====================================================
  // GET BLOB
  // Used for image / video attachments
  // =====================================================

  getBlob(
    endpoint: string
  ): Observable<Blob> {

    return this.http.get(
      `${this.baseUrl}/${endpoint}`,
      {
        responseType: 'blob'
      }
    );
  }


  // =====================================================
  // POST
  // =====================================================

  post<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {

    return this.http.post<T>(
      `${this.baseUrl}/${endpoint}`,
      body
    );
  }


  // =====================================================
  // PUT
  // =====================================================

  put<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {

    return this.http.put<T>(
      `${this.baseUrl}/${endpoint}`,
      body
    );
  }


  // =====================================================
  // DELETE
  // =====================================================

  delete<T>(
    endpoint: string
  ): Observable<T> {

    return this.http.delete<T>(
      `${this.baseUrl}/${endpoint}`
    );
  }


  // =====================================================
  // FILE UPLOAD
  // =====================================================

  upload<T>(
    endpoint: string,
    formData: FormData
  ): Observable<T> {

    return this.http.post<T>(
      `${this.baseUrl}/${endpoint}`,
      formData
    );
  }
}