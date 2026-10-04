import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiClientService } from './api-client.service';

import {
  Claim,
  ClaimDashboard,
  CreateClaimRequest
} from '../models/claim.models';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {

  constructor(
    private apiClient: ApiClientService
  ) {}


  // =====================================================
  // DASHBOARD
  // =====================================================

  getDashboard():
    Observable<ClaimDashboard> {

    return this.apiClient.get<ClaimDashboard>(
      'Claims/dashboard'
    );
  }


  // =====================================================
  // ALL CLAIMS
  // MANAGER
  // =====================================================

  getAllClaims():
    Observable<Claim[]> {

    return this.apiClient.get<Claim[]>(
      'Claims'
    );
  }


  // =====================================================
  // MY CLAIMS
  // USER
  // =====================================================

  getMyClaims():
    Observable<Claim[]> {

    return this.apiClient.get<Claim[]>(
      'Claims/my'
    );
  }


  // =====================================================
  // ASSIGNED CLAIMS
  // EMPLOYEE
  // =====================================================

  getAssignedClaims():
    Observable<Claim[]> {

    return this.apiClient.get<Claim[]>(
      'Claims/assigned'
    );
  }


  // =====================================================
  // CREATE CLAIM
  // =====================================================

  createClaim(
    request: CreateClaimRequest
  ): Observable<Claim> {

    const formData =
      new FormData();

    formData.append(
      'Title',
      request.title
    );

    formData.append(
      'Description',
      request.description
    );

    if (request.photo) {

      formData.append(
        'Photo',
        request.photo
      );
    }

    if (request.video) {

      formData.append(
        'Video',
        request.video
      );
    }

    return this.apiClient.upload<Claim>(
      'Claims',
      formData
    );
  }


  // =====================================================
  // GET CLAIM DETAILS
  // =====================================================

  getClaimById(
    id: number
  ): Observable<Claim> {

    return this.apiClient.get<Claim>(
      `Claims/${id}`
    );
  }


  // =====================================================
  // ASSIGN CLAIM
  // MANAGER
  // Raised -> InProgress
  // =====================================================

  assignClaim(
    id: number,
    employeeUserId: string
  ): Observable<unknown> {

    return this.apiClient.put(
      `Claims/${id}/assign`,
      {
        employeeUserId
      }
    );
  }


  // =====================================================
  // EMPLOYEE -> REVIEW
  // InProgress -> Review
  // =====================================================

  submitForReview(
    id: number,
    comment?: string
  ): Observable<unknown> {

    return this.apiClient.put(
      `Claims/${id}/status`,
      {
        status: 'Review',
        comment
      }
    );
  }


  // =====================================================
  // MANAGER -> VERIFY
  // Review -> Closed / InProgress
  // =====================================================

  verifyClaim(
    id: number,
    approved: boolean,
    comment?: string
  ): Observable<unknown> {

    return this.apiClient.put(
      `Claims/${id}/verify`,
      {
        approved,
        comment
      }
    );
  }


  // =====================================================
  // GET ATTACHMENT
  // =====================================================

  getAttachment(
    claimId: number,
    attachmentId: number
  ): Observable<Blob> {

    return this.apiClient.getBlob(
      `Claims/${claimId}/attachments/${attachmentId}`
    );
  }
}