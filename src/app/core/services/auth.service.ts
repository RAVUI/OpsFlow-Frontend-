import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';

import { ApiClientService } from './api-client.service';

import {
  LoginRequest,
  LoginResponse,
  UserProfile,
  AuthUser,
  RegisterRequest,
  RegisterResponse,
  Organization
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey =
    'opsflow_access_token';

  private readonly userKey =
    'opsflow_user';

  currentUser = signal<UserProfile | null>(
    this.getStoredUser()
  );

  constructor(
    private apiClient: ApiClientService,
    private router: Router
  ) {}

  // =========================
  // LOGIN
  // =========================

  login(
    request: LoginRequest
  ): Observable<AuthUser> {

    return this.apiClient
      .post<LoginResponse>(
        'Auth/login',
        request
      )
      .pipe(

        tap(response => {

          localStorage.setItem(
            this.tokenKey,
            response.accessToken
          );

        }),

        switchMap(() =>
          this.getCurrentUser()
        )
      );
  }


  // =========================
  // CURRENT USER
  // =========================

  getCurrentUser(): Observable<AuthUser> {

    return this.apiClient
      .get<UserProfile>('Auth/me')
      .pipe(

        map(user => {

          const token =
            this.getAccessToken() ?? '';

          localStorage.setItem(
            this.userKey,
            JSON.stringify(user)
          );

          this.currentUser.set(user);

          return {
            accessToken: token,
            user
          };

        })
      );
  }


  // =========================
  // TOKEN
  // =========================

  getAccessToken(): string | null {

    return localStorage.getItem(
      this.tokenKey
    );
  }


  // =========================
  // USER
  // =========================

  getUser(): UserProfile | null {

    return this.currentUser();
  }


  // =========================
  // LOGIN STATUS
  // =========================

  isLoggedIn(): boolean {

    return !!this.getAccessToken();
  }


  // =========================
  // ROLE
  // =========================

  hasRole(role: string): boolean {

    return this.getUser()?.role === role;
  }


  // =========================
  // INITIALIZE AUTH
  // =========================

  initializeAuth(): void {

    const token =
      this.getAccessToken();

    const user =
      this.getStoredUser();

    if (token && user) {

      this.currentUser.set(user);

    }
  }


  // =========================
  // LOGOUT
  // =========================

  logout(): void {

    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      this.userKey
    );

    this.currentUser.set(null);

    this.router.navigate([
      '/login'
    ]);
  }


  // =========================
  // REGISTER
  // =========================

  register(
  request: RegisterRequest
): Observable<RegisterResponse> {

  return this.apiClient.post<RegisterResponse>(
    'Auth/register',
    request
  );
}


getOrganizations(): Observable<Organization[]> {

  return this.apiClient.get<Organization[]>(
    'Auth/organizations'
  );
}


  // =========================
  // STORED USER
  // =========================

  private getStoredUser():
    UserProfile | null {

    const user =
      localStorage.getItem(
        this.userKey
      );

    if (!user) {
      return null;
    }

    try {

      return JSON.parse(user);

    } catch {

      return null;

    }
  }
}
