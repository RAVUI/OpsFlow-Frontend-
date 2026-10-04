import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '../../core/services/user.service';

import {
  ManagedUser,
  OrganizationOption
} from '../../core/models/user.models';


// =====================================================
// USER ROLE TYPE
// =====================================================

type UserRole =
  | 'User'
  | 'Employee'
  | 'Manager';


@Component({
  selector: 'app-users',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})


export class UsersComponent implements OnInit {

  // =====================================================
  // DATA
  // =====================================================

  users: ManagedUser[] = [];

  /*
   * Master user list.
   * Backend data is stored here.
   * Search / organization / role filters
   * are applied locally.
   */
  private allUsers: ManagedUser[] = [];

  organizations: OrganizationOption[] = [];


  // =====================================================
  // FILTERS
  // =====================================================

  searchText = '';

  selectedOrganization = '';

  selectedRole: UserRole | '' = '';


  // =====================================================
  // LOADING / MESSAGES
  // =====================================================

  loading = false;

  updatingUserId: string | null = null;

  errorMessage = '';

  successMessage = '';


  // =====================================================
  // DROPDOWNS
  // =====================================================

  /*
   * Organization filter dropdown
   */
  organizationDropdownOpen = false;


  /*
   * Role filter dropdown
   */
  roleDropdownOpen = false;


  /*
   * Card role update dropdown.
   *
   * Only one card dropdown can be open
   * at a time.
   */
  roleUpdateDropdownUserId: string | null = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadOrganizations();

    this.loadUsers();

  }


  // =====================================================
  // LOAD USERS
  // =====================================================

  loadUsers(): void {

    this.loading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * Backend GetUsers() does not accept
     * search / organization / role parameters.
     *
     * So we fetch all users once and filter
     * them locally.
     */
    this.userService
      .getUsers()
      .subscribe({

        next: users => {

          this.allUsers = users ?? [];

          this.applyFilters();

          this.loading = false;

          this.cdr.detectChanges();

        },


        error: error => {

          console.error(
            'Users loading failed:',
            error
          );

          this.allUsers = [];

          this.users = [];

          this.loading = false;

          this.errorMessage =
            error?.error?.message ??
            'Failed to load users.';

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // APPLY LOCAL FILTERS
  // =====================================================

  private applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.users =
      this.allUsers.filter(user => {

        // -----------------------------------------------
        // SEARCH
        // -----------------------------------------------

        const matchesSearch =
          !search ||
          user.name
            ?.toLowerCase()
            .includes(search) ||
          user.email
            ?.toLowerCase()
            .includes(search) ||
          user.organizationName
            ?.toLowerCase()
            .includes(search) ||
          user.location
            ?.toLowerCase()
            .includes(search);


        // -----------------------------------------------
        // ORGANIZATION
        // -----------------------------------------------

        const matchesOrganization =
          !this.selectedOrganization ||
          user.organizationId ===
            this.selectedOrganization;


        // -----------------------------------------------
        // ROLE
        // -----------------------------------------------

        const matchesRole =
          !this.selectedRole ||
          user.role === this.selectedRole;


        return (
          matchesSearch &&
          matchesOrganization &&
          matchesRole
        );

      });


    this.cdr.detectChanges();

  }


  // =====================================================
  // LOAD ORGANIZATIONS
  // =====================================================

  loadOrganizations(): void {

    this.userService
      .getOrganizations()
      .subscribe({

        next: organizations => {

          this.organizations =
            organizations ?? [];

          this.cdr.detectChanges();

        },


        error: error => {

          console.error(
            'Organizations loading failed:',
            error
          );

          this.organizations = [];

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // SEARCH
  // =====================================================

  searchUsers(): void {

    this.applyFilters();

  }


  onSearchKeydown(
    event: KeyboardEvent
  ): void {

    if (event.key === 'Enter') {

      this.searchUsers();

    }

  }


  // =====================================================
  // ORGANIZATION DROPDOWN
  // =====================================================

  toggleOrganizationDropdown(
    event?: MouseEvent
  ): void {

    event?.stopPropagation();


    this.organizationDropdownOpen =
      !this.organizationDropdownOpen;


    this.roleDropdownOpen = false;

    this.roleUpdateDropdownUserId =
      null;


    this.cdr.detectChanges();

  }


  // =====================================================
  // SELECT ORGANIZATION
  // =====================================================

  selectOrganization(
    organizationId: string
  ): void {

    this.selectedOrganization =
      organizationId;


    this.organizationDropdownOpen =
      false;


    this.roleUpdateDropdownUserId =
      null;


    this.applyFilters();

    this.cdr.detectChanges();

  }


  // =====================================================
  // SELECTED ORGANIZATION NAME
  // =====================================================

  get selectedOrganizationName(): string {

    if (!this.selectedOrganization) {

      return 'All Organizations';

    }


    const organization =
      this.organizations.find(
        x =>
          x.id ===
          this.selectedOrganization
      );


    return (
      organization?.name ??
      'All Organizations'
    );

  }


  // =====================================================
  // ROLE FILTER DROPDOWN
  // =====================================================

  toggleRoleDropdown(
    event?: MouseEvent
  ): void {

    event?.stopPropagation();


    this.roleDropdownOpen =
      !this.roleDropdownOpen;


    this.organizationDropdownOpen =
      false;


    this.roleUpdateDropdownUserId =
      null;


    this.cdr.detectChanges();

  }


  // =====================================================
  // SELECT ROLE FILTER
  // =====================================================

  selectRole(
    role: UserRole | ''
  ): void {

    this.selectedRole = role;

    this.roleDropdownOpen = false;

    this.roleUpdateDropdownUserId =
      null;


    this.applyFilters();

    this.cdr.detectChanges();

  }


  // =====================================================
  // SELECTED ROLE NAME
  // =====================================================

  get selectedRoleName(): string {

    return (
      this.selectedRole ||
      'All Roles'
    );

  }


  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedOrganization = '';

    this.selectedRole = '';


    this.organizationDropdownOpen =
      false;

    this.roleDropdownOpen =
      false;

    this.roleUpdateDropdownUserId =
      null;


    this.applyFilters();

    this.cdr.detectChanges();

  }


  // =====================================================
  // CARD ROLE UPDATE DROPDOWN
  // =====================================================

  toggleRoleUpdateDropdown(
    userId: string,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();


    /*
     * Do not allow opening dropdown
     * while this user's role is being updated.
     */
    if (
      this.updatingUserId ===
      userId
    ) {

      return;

    }


    if (
      this.roleUpdateDropdownUserId ===
      userId
    ) {

      this.roleUpdateDropdownUserId =
        null;

    } else {

      this.roleUpdateDropdownUserId =
        userId;

    }


    this.organizationDropdownOpen =
      false;

    this.roleDropdownOpen =
      false;


    this.cdr.detectChanges();

  }


  // =====================================================
  // UPDATE ROLE
  // =====================================================

  updateRole(
    user: ManagedUser,
    newRole: UserRole
  ): void {

    /*
     * Nothing to update.
     */
    if (
      !newRole ||
      newRole === user.role
    ) {

      this.roleUpdateDropdownUserId =
        null;

      this.cdr.detectChanges();

      return;

    }


    /*
     * Save previous role.
     *
     * If backend fails, we restore it.
     */
    const previousRole =
      user.role;


    // -----------------------------------------------
    // START UPDATE STATE
    // -----------------------------------------------

    this.updatingUserId =
      user.userId;

    this.roleUpdateDropdownUserId =
      null;

    this.errorMessage = '';

    this.successMessage = '';


    this.cdr.detectChanges();


    // -----------------------------------------------
    // API CALL
    // -----------------------------------------------

    this.userService
      .updateRole(
        user.userId,
        newRole
      )
      .subscribe({

        // ===========================================
        // SUCCESS
        // ===========================================

        next: () => {

          /*
           * Update current card immediately.
           */
          user.role = newRole;


          /*
           * Update master list also.
           */
          const masterUser =
            this.allUsers.find(
              x =>
                x.userId ===
                user.userId
            );


          if (masterUser) {

            masterUser.role =
              newRole;

          }


          this.updatingUserId =
            null;


          this.successMessage =
            `${user.name}'s role updated successfully.`;


          /*
           * If role filter is active and
           * user no longer matches it,
           * update the visible list.
           */
          if (
            this.selectedRole &&
            this.selectedRole !== newRole
          ) {

            this.applyFilters();

          }


          this.cdr.detectChanges();

        },


        // ===========================================
        // ERROR
        // ===========================================

        error: error => {

          console.error(
            'Role update failed:',
            error
          );


          /*
           * Restore previous role.
           */
          user.role =
            previousRole;


          const masterUser =
            this.allUsers.find(
              x =>
                x.userId ===
                user.userId
            );


          if (masterUser) {

            masterUser.role =
              previousRole;

          }


          this.updatingUserId =
            null;

          this.roleUpdateDropdownUserId =
            null;


          this.errorMessage =
            error?.error?.message ??
            'Failed to update user role.';


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // ROLE LABEL
  // =====================================================

  getRoleLabel(
    role: string
  ): string {

    switch (role) {

      case 'Manager':
        return 'Manager';

      case 'Employee':
        return 'Employee';

      case 'User':
        return 'User';

      default:
        return role;

    }

  }


  // =====================================================
  // ROLE CLASS
  // =====================================================

  getRoleClass(
    role: string
  ): string {

    switch (role) {

      case 'Manager':
        return 'manager';

      case 'Employee':
        return 'employee';

      case 'User':
        return 'user';

      default:
        return 'user';

    }

  }


  // =====================================================
  // AVATAR INITIAL
  // =====================================================

  getInitial(
    name: string
  ): string {

    if (!name) {

      return '?';

    }


    return name
      .trim()
      .charAt(0)
      .toUpperCase();

  }


  // =====================================================
  // AVATAR COLOR
  // =====================================================

  getAvatarClass(
    user: ManagedUser
  ): string {

    const value =
      user.userId ||
      user.email ||
      user.name ||
      '';


    let hash = 0;


    for (
      let i = 0;
      i < value.length;
      i++
    ) {

      hash =
        value.charCodeAt(i) +
        ((hash << 5) - hash);

    }


    const colors = [
      'purple',
      'blue',
      'green',
      'orange',
      'pink',
      'teal'
    ];


    return colors[
      Math.abs(hash) %
      colors.length
    ];

  }


  // =====================================================
  // TRACK USERS
  // =====================================================

  trackByUser(
    _index: number,
    user: ManagedUser
  ): string {

    return user.userId;

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


    /*
     * Keep dropdown open if click
     * happened inside any custom dropdown.
     */
    if (
      target.closest(
        '.custom-dropdown'
      ) ||
      target.closest(
        '.role-update-wrapper'
      )
    ) {

      return;

    }


    this.organizationDropdownOpen =
      false;

    this.roleDropdownOpen =
      false;

    this.roleUpdateDropdownUserId =
      null;


    this.cdr.detectChanges();

  }

}