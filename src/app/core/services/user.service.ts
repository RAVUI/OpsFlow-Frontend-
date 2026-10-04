import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService }
  from './api-client.service';

import {
  ManagedUser,
  OrganizationOption,
  UserRole
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private apiClient: ApiClientService
  ) {}


  // ==========================================
  // GET ALL USERS
  // Backend:
  // GET /api/Auth/users
  // ==========================================

  getUsers(): Observable<ManagedUser[]> {

    return this.apiClient.get<ManagedUser[]>(
      'Auth/users'
    );
  }


  // ==========================================
  // GET ORGANIZATIONS
  // Backend:
  // GET /api/Auth/organizations
  // ==========================================

  getOrganizations():
    Observable<OrganizationOption[]> {

    return this.apiClient.get<
      OrganizationOption[]
    >(
      'Auth/organizations'
    );
  }


  // ==========================================
  // UPDATE USER ROLE
  //
  // Backend:
  // PUT /api/Auth/users/role
  //
  // Body:
  // {
  //   userId: "...",
  //   role: "Manager"
  // }
  // ==========================================

  updateRole(
    userId: string,
    role: UserRole
  ): Observable<unknown> {

    return this.apiClient.put(
      'Auth/users/role',
      {
        userId,
        role
      }
    );
  }

}