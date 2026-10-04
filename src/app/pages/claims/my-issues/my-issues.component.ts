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
import { Claim } from '../../../core/models/claim.models';

@Component({
  selector: 'app-my-issues',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './my-issues.component.html',
  styleUrl: './my-issues.component.css'
})
export class MyIssuesComponent
  implements OnInit, OnDestroy {

  // =========================================================
  // DATA
  // =========================================================

  claims: Claim[] = [];

  filteredClaims: Claim[] = [];

  selectedClaim: Claim | null = null;


  // =========================================================
  // CREATE
  // =========================================================

  showCreate = false;

  title = '';

  description = '';

  photo?: File;

  video?: File;


  // =========================================================
  // STATE
  // =========================================================

  loading = false;

  detailsLoading = false;

  detailsOpen = false;

  errorMessage = '';

  successMessage = '';


  // =========================================================
  // FILTER
  // =========================================================

  searchText = '';

  selectedStatus = '';

  statusDropdownOpen = false;


  // =========================================================
  // ATTACHMENT STATE
  // =========================================================

  private attachmentUrls =
    new Map<number, string>();

  private attachmentLoading =
    new Set<number>();


  constructor(
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // CHANGE DETECTION
  // =========================================================

  public refreshView(): void {

    this.cdr.markForCheck();

    this.cdr.detectChanges();

  }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadClaims();

  }


  ngOnDestroy(): void {

    this.revokeAttachmentUrls();

  }


  // =========================================================
  // LOAD CLAIMS
  // =========================================================

  loadClaims(): void {

    this.loading = true;

    this.errorMessage = '';

    this.refreshView();


    this.claimService
      .getMyClaims()
      .subscribe({

        next: claims => {

          this.claims =
            Array.isArray(claims)
              ? [...claims]
              : [];

          this.applyFilters(false);

          this.loading = false;

          this.refreshView();

        },

        error: error => {

          console.error(
            'Failed to load my claims:',
            error
          );

          this.claims = [];

          this.filteredClaims = [];

          this.loading = false;

          this.errorMessage =
            error?.error?.message ??
            'Failed to load your issues. Please try again.';

          this.refreshView();

        }

      });

  }


  // =========================================================
  // FILTER
  // =========================================================

  applyFilters(
    detect = true
  ): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredClaims =
      this.claims.filter(claim => {

        const matchesSearch =
          !search ||
          String(claim.id)
            .toLowerCase()
            .includes(search) ||
          (claim.title ?? '')
            .toLowerCase()
            .includes(search) ||
          (claim.description ?? '')
            .toLowerCase()
            .includes(search) ||
          (claim.assignedEmployeeName ?? '')
            .toLowerCase()
            .includes(search);


        const matchesStatus =
          !this.selectedStatus ||
          claim.status === this.selectedStatus;


        return (
          matchesSearch &&
          matchesStatus
        );

      });


    if (detect) {
      this.refreshView();
    }

  }


  clearSearch(): void {

    this.searchText = '';

    this.applyFilters();

  }


  clearFilters(): void {

    this.searchText = '';

    this.selectedStatus = '';

    this.statusDropdownOpen = false;

    this.applyFilters();

  }


  // =========================================================
  // STATUS DROPDOWN
  // =========================================================

  toggleStatusDropdown(
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.statusDropdownOpen =
      !this.statusDropdownOpen;

    this.refreshView();

  }


  selectStatus(
    status: string
  ): void {

    this.selectedStatus = status;

    this.statusDropdownOpen = false;

    this.applyFilters();

  }


  // =========================================================
  // CREATE MODAL
  // =========================================================

  openCreate(): void {

    this.errorMessage = '';

    this.successMessage = '';

    this.showCreate = true;

    this.refreshView();

  }


  closeCreate(): void {

    if (this.loading) {
      return;
    }

    this.showCreate = false;

    this.resetCreateForm();

    this.refreshView();

  }


  resetCreateForm(): void {

    this.title = '';

    this.description = '';

    this.photo = undefined;

    this.video = undefined;

  }


  // =========================================================
  // PHOTO
  // =========================================================

  onPhotoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    if (!file.type.startsWith('image/')) {

      this.errorMessage =
        'Please select a valid image file.';

      input.value = '';

      this.refreshView();

      return;

    }


    this.photo = file;

    this.errorMessage = '';

    this.refreshView();

  }


  // =========================================================
  // VIDEO
  // =========================================================

  onVideoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    if (!file.type.startsWith('video/')) {

      this.errorMessage =
        'Please select a valid video file.';

      input.value = '';

      this.refreshView();

      return;

    }


    this.video = file;

    this.errorMessage = '';

    this.refreshView();

  }


  // =========================================================
  // CREATE VALIDATION
  // =========================================================

  get canSubmit(): boolean {

    return (
      this.title.trim().length > 0 &&
      this.description.trim().length > 0
    );

  }


  // =========================================================
  // CREATE ISSUE
  // =========================================================

  createIssue(): void {

    if (
      !this.canSubmit ||
      this.loading
    ) {
      return;
    }


    this.loading = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.refreshView();


    this.claimService
      .createClaim({

        title:
          this.title.trim(),

        description:
          this.description.trim(),

        photo:
          this.photo,

        video:
          this.video

      })
      .subscribe({

        next: () => {

          this.loading = false;

          this.showCreate = false;

          this.resetCreateForm();

          this.successMessage =
            'Issue raised successfully.';

          this.refreshView();


          /*
           * Fetch latest backend state.
           */

          this.loadClaims();

        },

        error: error => {

          console.error(
            'Create claim failed:',
            error
          );

          this.loading = false;

          this.errorMessage =
            error?.error?.message ??
            'Unable to raise the issue. Please try again.';

          this.refreshView();

        }

      });

  }


  // =========================================================
  // OPEN DETAILS
  // =========================================================

  openDetails(
    claim: Claim
  ): void {

    /*
     * Reset previous details state first.
     */

    this.detailsOpen = true;

    this.detailsLoading = true;

    this.errorMessage = '';

    this.statusDropdownOpen = false;


    /*
     * Immediately show the clicked card.
     * This gives instant UI feedback.
     */

    this.selectedClaim = {
      ...claim
    };


    /*
     * FORCE CHANGE DETECTION
     */

    this.refreshView();


    /*
     * Fetch complete claim from backend.
     */

    this.claimService
      .getClaimById(claim.id)
      .subscribe({

        next: fullClaim => {

          /*
           * IMPORTANT:
           * Create a NEW object reference.
           * Do not mutate the previous selectedClaim.
           */

          this.selectedClaim = {
            ...fullClaim,

            attachments:
              fullClaim?.attachments
                ? [...fullClaim.attachments]
                : [],

            history:
              fullClaim?.history
                ? [...fullClaim.history]
                : []
          };


          this.detailsLoading = false;


          /*
           * FIRST UI REFRESH
           *
           * This makes the drawer display the
           * complete API response immediately.
           */

          this.refreshView();


          /*
           * Now load attachments.
           */

          this.loadAttachments(
            this.selectedClaim
          );

        },

        error: error => {

          console.error(
            'Failed to load claim details:',
            error
          );


          /*
           * Keep the card data visible instead
           * of closing the drawer.
           */

          this.selectedClaim = {
            ...claim
          };

          this.detailsLoading = false;

          this.errorMessage =
            error?.error?.message ??
            'Unable to load complete issue details.';

          this.refreshView();

        }

      });

  }


  // =========================================================
  // CLOSE DETAILS
  // =========================================================

  closeDetails(): void {

    this.detailsOpen = false;

    this.detailsLoading = false;

    this.selectedClaim = null;

    this.refreshView();

  }


  // =========================================================
  // LOAD ATTACHMENTS
  // =========================================================

  private loadAttachments(
    claim: Claim | null
  ): void {

    if (!claim) {
      return;
    }


    if (
      !claim.attachments ||
      claim.attachments.length === 0
    ) {

      this.refreshView();

      return;

    }


    for (
      const attachment
      of claim.attachments
    ) {

      this.loadAttachment(
        claim.id,
        attachment.id
      );

    }

  }


  // =========================================================
  // LOAD ATTACHMENT
  // =========================================================

  loadAttachment(
    claimId: number,
    attachmentId: number
  ): void {

    if (
      this.attachmentUrls.has(
        attachmentId
      )
    ) {
      return;
    }


    if (
      this.attachmentLoading.has(
        attachmentId
      )
    ) {
      return;
    }


    /*
     * START LOADING
     */

    this.attachmentLoading.add(
      attachmentId
    );

    this.refreshView();


    this.claimService
      .getAttachment(
        claimId,
        attachmentId
      )
      .subscribe({

        next: blob => {

          /*
           * Make sure response is actually
           * usable by the browser.
           */

          if (!(blob instanceof Blob)) {

            console.error(
              'Attachment response is not a Blob:',
              blob
            );

            this.attachmentLoading.delete(
              attachmentId
            );

            this.refreshView();

            return;

          }


          const url =
            URL.createObjectURL(blob);


          this.attachmentUrls.set(
            attachmentId,
            url
          );


          this.attachmentLoading.delete(
            attachmentId
          );


          /*
           * FORCE UI UPDATE AFTER BLOB ARRIVES
           */

          this.refreshView();

        },

        error: error => {

          console.error(
            `Attachment ${attachmentId} loading failed:`,
            error
          );


          this.attachmentLoading.delete(
            attachmentId
          );


          this.refreshView();

        }

      });

  }


  // =========================================================
  // ATTACHMENT URL
  // =========================================================

  getAttachmentUrl(
    attachmentId: number
  ): string | null {

    return (
      this.attachmentUrls.get(
        attachmentId
      ) ?? null
    );

  }


  // =========================================================
  // ATTACHMENT LOADING
  // =========================================================

  isAttachmentLoading(
    attachmentId: number
  ): boolean {

    return this.attachmentLoading.has(
      attachmentId
    );

  }


  // =========================================================
  // IMAGE
  // =========================================================

  isImage(
    contentType?: string
  ): boolean {

    return !!contentType &&
      contentType
        .toLowerCase()
        .startsWith('image/');

  }


  // =========================================================
  // VIDEO
  // =========================================================

  isVideo(
    contentType?: string
  ): boolean {

    return !!contentType &&
      contentType
        .toLowerCase()
        .startsWith('video/');

  }


  // =========================================================
  // STATUS CLASS
  // =========================================================

  getStatusClass(
    status?: string
  ): string {

    switch (status) {

      case 'Raised':
        return 'status-raised';

      case 'InProgress':
        return 'status-progress';

      case 'Review':
        return 'status-review';

      case 'Closed':
        return 'status-closed';

      default:
        return 'status-default';

    }

  }


  // =========================================================
  // STATUS LABEL
  // =========================================================

  getStatusLabel(
    status?: string
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
        return status || 'Unknown';

    }

  }


  // =========================================================
  // FILE SIZE
  // =========================================================

  formatFileSize(
    bytes: number
  ): string {

    if (!bytes) {
      return '0 KB';
    }


    if (bytes < 1024) {
      return `${bytes} B`;
    }


    if (bytes < 1024 * 1024) {

      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;

    }


    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;

  }


  // =========================================================
  // CLEANUP
  // =========================================================

  private revokeAttachmentUrls(): void {

    this.attachmentUrls.forEach(
      url => {

        URL.revokeObjectURL(url);

      }
    );


    this.attachmentUrls.clear();

    this.attachmentLoading.clear();

  }


  // =========================================================
  // DOCUMENT CLICK
  // =========================================================

  @HostListener(
    'document:click'
  )
  onDocumentClick(): void {

    if (
      this.statusDropdownOpen
    ) {

      this.statusDropdownOpen = false;

      this.refreshView();

    }

  }


  // =========================================================
  // ESCAPE
  // =========================================================

  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {

    if (this.detailsOpen) {

      this.closeDetails();

      return;

    }


    if (
      this.showCreate &&
      !this.loading
    ) {

      this.closeCreate();

    }

  }

}