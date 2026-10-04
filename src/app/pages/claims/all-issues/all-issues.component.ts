import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClaimService } from '../../../core/services/claim.service';
import { UserService } from '../../../core/services/user.service';

import {
  Claim,
  ClaimStatus,
  CreateClaimRequest
} from '../../../core/models/claim.models';

import {
  ManagedUser
} from '../../../core/models/user.models';

@Component({
  selector: 'app-all-issues',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './all-issues.component.html',
  styleUrl: './all-issues.component.css'
})
export class AllIssuesComponent implements OnInit, OnDestroy {

  // =====================================================
  // DATA
  // =====================================================

  claims: Claim[] = [];
  employees: ManagedUser[] = [];

  selectedClaim: Claim | null = null;

  // =====================================================
  // PAGE STATE
  // =====================================================

  loading = false;
  detailsLoading = false;
  creatingClaim = false;

  assigningClaimId: number | null = null;
  verifyingClaimId: number | null = null;

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  searchText = '';
  selectedStatus = '';

  statusDropdownOpen = false;

  readonly statusOptions = [
    {
      value: '',
      label: 'All Status',
      dot: 'all'
    },
    {
      value: 'Raised',
      label: 'Raised',
      dot: 'raised'
    },
    {
      value: 'InProgress',
      label: 'In Progress',
      dot: 'progress'
    },
    {
      value: 'Review',
      label: 'Review',
      dot: 'review'
    },
    {
      value: 'Closed',
      label: 'Closed',
      dot: 'closed'
    }
  ];

  // =====================================================
  // MESSAGES
  // =====================================================

  errorMessage = '';
  successMessage = '';

  // =====================================================
  // DETAILS DRAWER
  // =====================================================

  detailsOpen = false;

  // =====================================================
  // ASSIGNMENT DROPDOWN
  // =====================================================

  assignmentDropdownClaimId: number | null = null;

  // =====================================================
  // VERIFY MODAL
  // =====================================================

  verifyModalOpen = false;
  verifyApproved = true;
  verifyComment = '';
  verifyClaim: Claim | null = null;

  // =====================================================
  // CREATE ISSUE MODAL
  // =====================================================

  createModalOpen = false;

  newClaimTitle = '';
  newClaimDescription = '';

  selectedPhoto: File | null = null;
  selectedVideo: File | null = null;

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
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadClaims();
    this.loadEmployees();
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {
    this.clearAttachmentUrls();
  }

  // =====================================================
  // LOAD CLAIMS
  // =====================================================

  loadClaims(): void {
    this.loading = true;
    this.errorMessage = '';

    this.claimService.getAllClaims().subscribe({
      next: claims => {
        this.claims = claims ?? [];
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: error => {
        console.error('Failed to load claims:', error);

        this.claims = [];
        this.loading = false;

        this.errorMessage =
          error?.error?.message ??
          'Failed to load issues.';

        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  loadEmployees(): void {
    this.userService.getUsers().subscribe({
      next: users => {

        this.employees = (users ?? [])
          .filter(user => user.role === 'Employee');

        this.cdr.detectChanges();
      },

      error: error => {
        console.error('Failed to load employees:', error);

        this.employees = [];

        this.errorMessage =
          error?.error?.message ??
          'Failed to load employees.';

        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // FILTERED CLAIMS
  // =====================================================

  get filteredClaims(): Claim[] {
    const search = this.searchText
      .trim()
      .toLowerCase();

    return this.claims.filter(claim => {

      const matchesSearch =
        !search ||
        claim.title?.toLowerCase().includes(search) ||
        claim.description?.toLowerCase().includes(search) ||
        claim.raisedByName?.toLowerCase().includes(search) ||
        claim.organizationName?.toLowerCase().includes(search) ||
        String(claim.id).includes(search);

      const matchesStatus =
        !this.selectedStatus ||
        claim.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // =====================================================
  // STATUS DROPDOWN
  // =====================================================

  toggleStatusDropdown(event?: MouseEvent): void {
    event?.stopPropagation();

    this.statusDropdownOpen =
      !this.statusDropdownOpen;

    this.assignmentDropdownClaimId = null;
  }

  selectStatus(
    status: string,
    event?: MouseEvent
  ): void {
    event?.stopPropagation();

    this.selectedStatus = status;
    this.statusDropdownOpen = false;

    this.cdr.detectChanges();
  }

  get selectedStatusLabel(): string {
    const option = this.statusOptions.find(
      item => item.value === this.selectedStatus
    );

    return option?.label ?? 'All Status';
  }

  get selectedStatusDot(): string {
    const option = this.statusOptions.find(
      item => item.value === this.selectedStatus
    );

    return option?.dot ?? 'all';
  }

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.statusDropdownOpen = false;

    this.cdr.detectChanges();
  }

  // =====================================================
  // STATUS CLASS
  // =====================================================

  getStatusClass(
    status: ClaimStatus | string
  ): string {

    switch (status) {
      case 'Raised':
        return 'raised';

      case 'InProgress':
        return 'in-progress';

      case 'Review':
        return 'review';

      case 'Closed':
        return 'closed';

      default:
        return '';
    }
  }

  // =====================================================
  // STATUS LABEL
  // =====================================================

  getStatusLabel(
    status: ClaimStatus | string
  ): string {

    switch (status) {
      case 'InProgress':
        return 'In Progress';

      case 'Raised':
        return 'Raised';

      case 'Review':
        return 'Review';

      case 'Closed':
        return 'Closed';

      default:
        return status;
    }
  }

  // =====================================================
  // OPEN DETAILS
  // =====================================================

  openDetails(claim: Claim): void {

    this.detailsOpen = true;
    this.detailsLoading = true;

    this.selectedClaim = null;

    this.assignmentDropdownClaimId = null;
    this.statusDropdownOpen = false;

    this.errorMessage = '';

    /*
     * Clear old object URLs before loading
     * attachments belonging to the new issue.
     */
    this.clearAttachmentUrls();

    this.claimService.getClaimById(claim.id).subscribe({
      next: result => {

        this.selectedClaim = result;
        this.detailsLoading = false;

        this.cdr.detectChanges();

        /*
         * Automatically fetch every attachment.
         *
         * No "View" button is required anymore.
         * Images and videos appear automatically.
         */
        this.loadAllAttachments(result);
      },

      error: error => {
        console.error(
          'Failed to load claim details:',
          error
        );

        this.detailsLoading = false;

        this.errorMessage =
          error?.error?.message ??
          'Failed to load issue details.';

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

    this.assignmentDropdownClaimId = null;

    this.clearAttachmentUrls();

    this.cdr.detectChanges();
  }

  // =====================================================
  // LOAD ALL ATTACHMENTS AUTOMATICALLY
  // =====================================================

  private loadAllAttachments(
    claim: Claim
  ): void {

    if (!claim.attachments?.length) {
      return;
    }

    for (const attachment of claim.attachments) {
      this.loadAttachment(attachment.id);
    }
  }

  // =====================================================
  // LOAD ATTACHMENT
  // =====================================================

  loadAttachment(
    attachmentId: number
  ): void {

    if (this.attachmentUrls[attachmentId]) {
      return;
    }

    if (this.attachmentLoading[attachmentId]) {
      return;
    }

    if (!this.selectedClaim?.id) {
      return;
    }

    this.attachmentLoading[attachmentId] = true;

    this.claimService
      .getAttachment(
        this.selectedClaim.id,
        attachmentId
      )
      .subscribe({

        next: blob => {

          const url =
            URL.createObjectURL(blob);

          this.attachmentUrls[attachmentId] = url;

          this.attachmentLoading[attachmentId] = false;

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Attachment loading failed:',
            error
          );

          this.attachmentLoading[attachmentId] = false;

          this.errorMessage =
            error?.error?.message ??
            'Failed to load attachment.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // GET ATTACHMENT URL
  // =====================================================

  getAttachmentUrl(
    attachmentId: number
  ): string | null {

    return this.attachmentUrls[attachmentId] ?? null;
  }

  // =====================================================
  // IMAGE CHECK
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
  // VIDEO CHECK
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
  // OTHER FILE
  // =====================================================

  isOtherFile(
    contentType: string
  ): boolean {

    return !this.isImage(contentType) &&
      !this.isVideo(contentType);
  }

  // =====================================================
  // ATTACHMENT TYPE LABEL
  // =====================================================

  getAttachmentType(
    contentType: string
  ): string {

    if (this.isImage(contentType)) {
      return 'Image';
    }

    if (this.isVideo(contentType)) {
      return 'Video';
    }

    return 'File';
  }

  // =====================================================
  // CLEAR ATTACHMENT URLS
  // =====================================================

  private clearAttachmentUrls(): void {

    Object.values(this.attachmentUrls)
      .forEach(url => URL.revokeObjectURL(url));

    this.attachmentUrls = {};
    this.attachmentLoading = {};
  }

  // =====================================================
  // ASSIGNMENT DROPDOWN
  // =====================================================

  toggleAssignmentDropdown(
    claimId: number,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.statusDropdownOpen = false;

    if (this.assigningClaimId === claimId) {
      return;
    }

    if (
      this.assignmentDropdownClaimId === claimId
    ) {
      this.assignmentDropdownClaimId = null;
    } else {
      this.assignmentDropdownClaimId = claimId;
    }

    this.cdr.detectChanges();
  }

  // =====================================================
  // ASSIGN CLAIM
  // =====================================================

  assignClaim(
    claim: Claim,
    employee: ManagedUser,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    if (this.assigningClaimId !== null) {
      return;
    }

    if (claim.status !== 'Raised') {
      this.errorMessage =
        'Only Raised issues can be assigned.';

      this.assignmentDropdownClaimId = null;

      return;
    }

    this.assigningClaimId = claim.id;
    this.assignmentDropdownClaimId = null;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

    this.claimService
      .assignClaim(
        claim.id,
        employee.userId
      )
      .subscribe({

        next: () => {

          claim.status = 'InProgress';

          claim.assignedEmployeeId =
            employee.userId;

          claim.assignedEmployeeName =
            employee.name;

          claim.assignedEmployeeEmail =
            employee.email;

          claim.assignedAt =
            new Date().toISOString();

          claim.updatedAt =
            new Date().toISOString();

          this.assigningClaimId = null;

          this.successMessage =
            `Issue #${claim.id} assigned to ${employee.name}.`;

          this.cdr.detectChanges();

          this.refreshClaimDetails(
            claim.id,
            false
          );
        },

        error: error => {

          console.error(
            'Claim assignment failed:',
            error
          );

          this.assigningClaimId = null;
          this.assignmentDropdownClaimId = null;

          this.errorMessage =
            error?.error?.message ??
            'Failed to assign issue.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // OPEN VERIFY MODAL
  // =====================================================

  openVerify(
    claim: Claim,
    approved: boolean,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    if (claim.status !== 'Review') {

      this.errorMessage =
        'Only issues in Review can be verified.';

      return;
    }

    this.verifyClaim = claim;
    this.verifyApproved = approved;
    this.verifyComment = '';

    this.verifyModalOpen = true;

    this.cdr.detectChanges();
  }

  // =====================================================
  // CLOSE VERIFY
  // =====================================================

  closeVerify(): void {

    this.verifyModalOpen = false;
    this.verifyClaim = null;
    this.verifyComment = '';

    this.cdr.detectChanges();
  }

  // =====================================================
  // VERIFY CLAIM
  // =====================================================

  verifySelectedClaim(): void {

    if (!this.verifyClaim) {
      return;
    }

    const claim = this.verifyClaim;

    this.verifyingClaimId = claim.id;

    this.errorMessage = '';
    this.successMessage = '';

    const approved =
      this.verifyApproved;

    const comment =
      this.verifyComment.trim();

    this.cdr.detectChanges();

    this.claimService
      .verifyClaim(
        claim.id,
        approved,
        comment || undefined
      )
      .subscribe({

        next: () => {

          if (approved) {

            claim.status = 'Closed';

            claim.resolutionComment =
              comment;

            claim.resolvedAt =
              new Date().toISOString();

            claim.updatedAt =
              new Date().toISOString();

            this.successMessage =
              `Issue #${claim.id} approved and closed.`;

          } else {

            claim.status = 'InProgress';

            claim.resolutionComment =
              comment;

            claim.updatedAt =
              new Date().toISOString();

            this.successMessage =
              `Issue #${claim.id} rejected and moved back to In Progress.`;
          }

          this.verifyingClaimId = null;

          this.closeVerify();

          this.cdr.detectChanges();

          this.refreshClaimDetails(
            claim.id,
            false
          );
        },

        error: error => {

          console.error(
            'Claim verification failed:',
            error
          );

          this.verifyingClaimId = null;

          this.errorMessage =
            error?.error?.message ??
            'Failed to verify issue.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // REFRESH CLAIM DETAILS
  // =====================================================

  refreshClaimDetails(
    claimId: number,
    openDrawer = true
  ): void {

    this.claimService
      .getClaimById(claimId)
      .subscribe({

        next: claim => {

          const index =
            this.claims.findIndex(
              x => x.id === claimId
            );

          if (index !== -1) {
            this.claims[index] = claim;
          }

          if (
            openDrawer &&
            this.detailsOpen
          ) {
            this.selectedClaim = claim;

            this.clearAttachmentUrls();

            this.loadAllAttachments(claim);
          }

          this.cdr.detectChanges();
        },

        error: error => {
          console.error(
            'Failed to refresh claim:',
            error
          );
        }
      });
  }

  // =====================================================
  // CREATE ISSUE
  // =====================================================

  openCreateModal(): void {

    this.createModalOpen = true;

    this.newClaimTitle = '';
    this.newClaimDescription = '';

    this.selectedPhoto = null;
    this.selectedVideo = null;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  closeCreateModal(): void {

    if (this.creatingClaim) {
      return;
    }

    this.createModalOpen = false;

    this.resetCreateForm();

    this.cdr.detectChanges();
  }

  // =====================================================
  // PHOTO SELECT
  // =====================================================

  onPhotoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.selectedPhoto =
      input.files?.[0] ?? null;

    this.cdr.detectChanges();
  }

  // =====================================================
  // VIDEO SELECT
  // =====================================================

  onVideoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.selectedVideo =
      input.files?.[0] ?? null;

    this.cdr.detectChanges();
  }

  // =====================================================
  // CREATE ISSUE
  // =====================================================

  createIssue(): void {

    const title =
      this.newClaimTitle.trim();

    const description =
      this.newClaimDescription.trim();

    if (!title) {
      this.errorMessage =
        'Issue title is required.';
      return;
    }

    if (!description) {
      this.errorMessage =
        'Issue description is required.';
      return;
    }

    const request: CreateClaimRequest = {
      title,
      description,
      photo:
        this.selectedPhoto ??
        undefined,
      video:
        this.selectedVideo ??
        undefined
    };

    this.creatingClaim = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

    this.claimService
      .createClaim(request)
      .subscribe({

        next: claim => {

          this.claims = [
            claim,
            ...this.claims
          ];

          this.creatingClaim = false;
          this.createModalOpen = false;

          this.resetCreateForm();

          this.successMessage =
            `Issue #${claim.id} created successfully.`;

          this.cdr.detectChanges();

          this.loadClaims();
        },

        error: error => {

          console.error(
            'Issue creation failed:',
            error
          );

          this.creatingClaim = false;

          this.errorMessage =
            error?.error?.message ??
            'Failed to create issue.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // RESET CREATE FORM
  // =====================================================

  resetCreateForm(): void {

    this.newClaimTitle = '';
    this.newClaimDescription = '';

    this.selectedPhoto = null;
    this.selectedVideo = null;
  }

  // =====================================================
  // INITIAL
  // =====================================================

  getInitial(
    name?: string
  ): string {

    if (!name?.trim()) {
      return '?';
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  // =====================================================
  // DATE FORMAT
  // =====================================================

  formatDate(
    value?: string | null
  ): string {

    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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
  // TRACK ATTACHMENT
  // =====================================================

  trackByAttachment(
    _index: number,
    attachment: {
      id: number;
    }
  ): number {

    return attachment.id;
  }

  // =====================================================
  // DOCUMENT CLICK
  // =====================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;

    if (
      target.closest('.custom-dropdown') ||
      target.closest('.assignment-dropdown')
    ) {
      return;
    }

    let changed = false;

    if (this.statusDropdownOpen) {
      this.statusDropdownOpen = false;
      changed = true;
    }

    if (this.assignmentDropdownClaimId !== null) {
      this.assignmentDropdownClaimId = null;
      changed = true;
    }

    if (changed) {
      this.cdr.detectChanges();
    }
  }
}