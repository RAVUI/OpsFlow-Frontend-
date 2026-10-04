import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../core/services/claim.service';
import { Claim } from '../../../core/models/claim.models';

@Component({
  selector: 'app-assigned-issues',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './assigned-issues.component.html',
  styleUrl: './assigned-issues.component.css'
})
export class AssignedIssuesComponent
  implements OnInit, OnDestroy {

  // =====================================================
  // DATA
  // =====================================================

  claims: Claim[] = [];

  selectedClaim: Claim | null = null;


  // =====================================================
  // PAGE STATE
  // =====================================================

  loading = true;

  refreshing = false;

  detailsLoading = false;

  updatingId: number | null = null;


  // =====================================================
  // DETAILS DRAWER
  // =====================================================

  detailsOpen = false;


  // =====================================================
  // REVIEW MODAL
  // =====================================================

  reviewModalOpen = false;

  reviewClaim: Claim | null = null;

  reviewComment = '';

  reviewSubmitting = false;


  // =====================================================
  // MESSAGES
  // =====================================================

  errorMessage = '';

  successMessage = '';


  // =====================================================
  // ATTACHMENTS
  // =====================================================

  attachmentUrls: Record<number, string> = {};

  attachmentLoading: Record<number, boolean> = {};


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadClaims();
  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {
    Object.values(this.attachmentUrls)
      .forEach(url => {
        URL.revokeObjectURL(url);
      });
  }


  // =====================================================
  // LOAD ASSIGNED ISSUES
  // =====================================================

  loadClaims(): void {

    const initialLoad =
      this.claims.length === 0 &&
      !this.refreshing;

    if (initialLoad) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    this.errorMessage = '';

    this.cdr.detectChanges();

    this.claimService
      .getAssignedClaims()
      .subscribe({

        next: claims => {

          this.claims = claims ?? [];

          this.loading = false;
          this.refreshing = false;

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Assigned issues loading failed:',
            error
          );

          this.claims = [];

          this.loading = false;
          this.refreshing = false;

          this.errorMessage =
            error?.error?.message ??
            'Unable to load assigned issues.';

          this.cdr.detectChanges();
        }

      });
  }


  // =====================================================
  // OPEN DETAILS
  // =====================================================

  openDetails(claim: Claim): void {

    this.detailsOpen = true;

    this.detailsLoading = true;

    this.selectedClaim = claim;

    this.errorMessage = '';

    this.cdr.detectChanges();


    this.claimService
      .getClaimById(claim.id)
      .subscribe({

        next: fullClaim => {

          this.selectedClaim = fullClaim;

          this.detailsLoading = false;

          this.cdr.detectChanges();

          this.preloadAttachments(fullClaim);
        },

        error: error => {

          console.error(
            'Failed to load issue details:',
            error
          );

          this.detailsLoading = false;

          this.errorMessage =
            error?.error?.message ??
            'Unable to load issue details.';

          this.cdr.detectChanges();
        }

      });
  }


  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  closeDetails(): void {

    this.detailsOpen = false;

    this.selectedClaim = null;

    this.detailsLoading = false;

    this.cdr.detectChanges();
  }


  // =====================================================
  // PRELOAD ATTACHMENTS
  // =====================================================

  private preloadAttachments(
    claim: Claim
  ): void {

    if (
      !claim.attachments ||
      claim.attachments.length === 0
    ) {
      return;
    }

    claim.attachments.forEach(
      attachment => {

        this.loadAttachment(
          attachment.id,
          claim.id
        );

      }
    );
  }


  // =====================================================
  // LOAD ATTACHMENT
  // =====================================================

  loadAttachment(
    attachmentId: number,
    claimId?: number
  ): void {

    if (
      this.attachmentUrls[attachmentId]
    ) {
      return;
    }

    if (
      this.attachmentLoading[attachmentId]
    ) {
      return;
    }

    const currentClaimId =
      claimId ??
      this.selectedClaim?.id;

    if (!currentClaimId) {
      return;
    }

    this.attachmentLoading[
      attachmentId
    ] = true;

    this.cdr.detectChanges();


    this.claimService
      .getAttachment(
        currentClaimId,
        attachmentId
      )
      .subscribe({

        next: blob => {

          const url =
            URL.createObjectURL(blob);

          this.attachmentUrls[
            attachmentId
          ] = url;

          this.attachmentLoading[
            attachmentId
          ] = false;

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Attachment loading failed:',
            error
          );

          this.attachmentLoading[
            attachmentId
          ] = false;

          this.errorMessage =
            error?.error?.message ??
            'Failed to load attachment.';

          this.cdr.detectChanges();
        }

      });
  }


  // =====================================================
  // ATTACHMENT URL
  // =====================================================

  getAttachmentUrl(
    attachmentId: number
  ): string | null {

    return (
      this.attachmentUrls[
        attachmentId
      ] ?? null
    );
  }


  // =====================================================
  // IMAGE
  // =====================================================

  isImage(
    contentType: string
  ): boolean {

    return !!contentType &&
      contentType
        .toLowerCase()
        .startsWith('image/');
  }


  // =====================================================
  // VIDEO
  // =====================================================

  isVideo(
    contentType: string
  ): boolean {

    return !!contentType &&
      contentType
        .toLowerCase()
        .startsWith('video/');
  }


  // =====================================================
  // OPEN ATTACHMENT
  // =====================================================

  openAttachment(
    attachmentId: number,
    claimId?: number
  ): void {

    const existingUrl =
      this.getAttachmentUrl(
        attachmentId
      );

    if (existingUrl) {

      window.open(
        existingUrl,
        '_blank'
      );

      return;
    }

    this.loadAttachment(
      attachmentId,
      claimId
    );
  }


  // =====================================================
  // OPEN REVIEW MODAL
  // =====================================================

  openReviewModal(
    claim: Claim
  ): void {

    if (
      claim.status !== 'InProgress'
    ) {
      return;
    }

    this.reviewClaim = claim;

    this.reviewComment = '';

    this.reviewModalOpen = true;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }


  // =====================================================
  // CLOSE REVIEW MODAL
  // =====================================================

  closeReviewModal(): void {

    if (this.reviewSubmitting) {
      return;
    }

    this.reviewModalOpen = false;

    this.reviewClaim = null;

    this.reviewComment = '';

    this.cdr.detectChanges();
  }


  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  submitReview(): void {

    if (!this.reviewClaim) {
      return;
    }

    const comment =
      this.reviewComment.trim();

    if (!comment) {

      this.errorMessage =
        'Please add a comment before submitting the issue for review.';

      this.cdr.detectChanges();

      return;
    }


    const claim =
      this.reviewClaim;

    this.reviewSubmitting = true;

    this.updatingId = claim.id;

    this.errorMessage = '';

    this.successMessage = '';

    this.cdr.detectChanges();


    this.claimService
      .submitForReview(
        claim.id,
        comment
      )
      .subscribe({

        next: () => {

          // Immediate UI state change
          claim.status = 'Review';

          this.reviewSubmitting = false;

          this.updatingId = null;

          this.reviewModalOpen = false;

          this.reviewClaim = null;

          this.reviewComment = '';

          this.successMessage =
            `Issue #${claim.id} has been submitted for review.`;

          this.cdr.detectChanges();


          // Get latest backend state
          this.refreshAssignedIssues(
            claim.id
          );
        },

        error: error => {

          console.error(
            'Status update failed:',
            error
          );

          this.reviewSubmitting = false;

          this.updatingId = null;

          this.errorMessage =
            error?.error?.message ??
            'Unable to submit the issue for review.';

          this.cdr.detectChanges();
        }

      });
  }


  // =====================================================
  // REFRESH AFTER STATUS CHANGE
  // =====================================================

  private refreshAssignedIssues(
    claimId?: number
  ): void {

    this.claimService
      .getAssignedClaims()
      .subscribe({

        next: claims => {

          this.claims = claims ?? [];

          if (
            claimId &&
            this.detailsOpen
          ) {

            const updated =
              this.claims.find(
                x => x.id === claimId
              );

            if (updated) {

              this.selectedClaim =
                updated;

              this.preloadAttachments(
                updated
              );
            }
          }

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Background refresh failed:',
            error
          );

          this.cdr.detectChanges();
        }

      });
  }


  // =====================================================
  // STATUS LABEL
  // =====================================================

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'InProgress':
        return 'In Progress';

      case 'Review':
        return 'Under Review';

      case 'Closed':
        return 'Closed';

      default:
        return status;
    }
  }


  // =====================================================
  // STATUS CLASS
  // =====================================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'InProgress':
        return 'in-progress';

      case 'Review':
        return 'review';

      case 'Closed':
        return 'closed';

      default:
        return 'default';
    }
  }


  // =====================================================
  // STATUS ICON
  // =====================================================

  getStatusIcon(
    status: string
  ): string {

    switch (status) {

      case 'InProgress':
        return '↻';

      case 'Review':
        return '◌';

      case 'Closed':
        return '✓';

      default:
        return '•';
    }
  }


  // =====================================================
  // FORMAT DATE
  // =====================================================

  formatDate(
    value: string | Date | null | undefined
  ): string {

    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }


  // =====================================================
  // TRACK CLAIM
  // =====================================================

  trackByClaim(
    _index: number,
    claim: Claim
  ): number {

    return claim.id;
  }


  // =====================================================
  // DISMISS SUCCESS
  // =====================================================

  dismissSuccess(): void {

    this.successMessage = '';

    this.cdr.detectChanges();
  }


  // =====================================================
  // DISMISS ERROR
  // =====================================================

  dismissError(): void {

    this.errorMessage = '';

    this.cdr.detectChanges();
  }
}