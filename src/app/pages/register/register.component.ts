import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

import {
  Organization,
  RegisterRequest
} from '../../core/models/auth.models';


@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent
  implements OnInit, OnDestroy {

  registerForm: FormGroup;

  organizations: Organization[] = [];

  loading = false;

  errorMessage = '';

  successMessage = '';

  showPassword = false;

  showConfirmPassword = false;

  organizationDropdownOpen = false;

  selectedOrganizationName = '';

  private toastTimer?: ReturnType<typeof setTimeout>;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.registerForm = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      confirmPassword: [
        '',
        Validators.required
      ],

      organizationId: [
        '',
        Validators.required
      ]

    });
  }


  ngOnInit(): void {

    this.loadOrganizations();

  }


  private loadOrganizations(): void {

    this.authService
      .getOrganizations()
      .subscribe({

        next: (organizations) => {

          this.organizations = organizations;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Organization loading error:',
            error
          );

          this.showError(
            this.getApiMessage(
              error,
              'Unable to load organizations.'
            )
          );

        }

      });

  }


  // =========================================================
  // ORGANIZATION DROPDOWN
  // =========================================================

  toggleOrganizationDropdown(
    event: Event
  ): void {

    event.stopPropagation();

    this.organizationDropdownOpen =
      !this.organizationDropdownOpen;

    this.cdr.detectChanges();

  }


  selectOrganization(
    organization: Organization
  ): void {

    this.registerForm
      .get('organizationId')
      ?.setValue(organization.id);

    this.registerForm
      .get('organizationId')
      ?.markAsTouched();

    this.selectedOrganizationName =
      organization.name;

    this.organizationDropdownOpen = false;

    this.cdr.detectChanges();

  }


  @HostListener(
    'document:click',
    ['$event']
  )
  closeOrganizationDropdown(
    event: Event
  ): void {

    const target =
      event.target as HTMLElement;

    if (
      !target.closest('.custom-dropdown')
    ) {

      this.organizationDropdownOpen = false;

      this.cdr.detectChanges();

    }

  }


  // =========================================================
  // PASSWORD
  // =========================================================

  togglePassword(): void {

    this.showPassword =
      !this.showPassword;

    this.cdr.detectChanges();

  }


  toggleConfirmPassword(): void {

    this.showConfirmPassword =
      !this.showConfirmPassword;

    this.cdr.detectChanges();

  }


  // =========================================================
  // REGISTER
  // =========================================================

  register(): void {

    this.clearToasts();

    this.organizationDropdownOpen = false;


    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      this.cdr.detectChanges();

      return;

    }


    const {
      name,
      email,
      password,
      confirmPassword,
      organizationId
    } = this.registerForm.value;


    if (password !== confirmPassword) {

      this.showError(
        'Passwords do not match.'
      );

      return;

    }


    const request: RegisterRequest = {

      name,
      email,
      password,
      organizationId

    };


    this.loading = true;

    this.cdr.detectChanges();


    this.authService
      .register(request)
      .subscribe({

        next: () => {

          this.loading = false;

          this.showSuccess(
            'Registration completed successfully.'
          );

          this.cdr.detectChanges();


          setTimeout(() => {

            this.router.navigate([
              '/login'
            ]);

          }, 1200);

        },


        error: (error) => {

          /*
           * Important:
           * Set loading false BEFORE showing
           * the API error and force UI refresh.
           */
          this.loading = false;

          this.cdr.detectChanges();


          console.error(
            'Registration error:',
            error
          );


          this.showError(
            this.getApiMessage(
              error,
              'Registration failed.'
            )
          );

        }

      });

  }


  // =========================================================
  // API RESPONSE MESSAGE
  // =========================================================

  private getApiMessage(
    error: any,
    fallback: string
  ): string {

    let response =
      error?.error;


    /*
     * Sometimes HttpClient gives the backend
     * response as a JSON string.
     *
     * Example:
     *
     * "{\"code\":422,\"error_code\":\"user_already_exists\",\"msg\":\"User already registered\"}"
     */
    if (
      typeof response === 'string'
    ) {

      try {

        response =
          JSON.parse(response);

      } catch {

        return response.trim() ||
          fallback;

      }

    }


    /*
     * Your API response uses "msg".
     */
    if (
      typeof response?.msg === 'string' &&
      response.msg.trim()
    ) {

      return response.msg.trim();

    }


    /*
     * Support message if another API
     * endpoint returns "message".
     */
    if (
      typeof response?.message === 'string' &&
      response.message.trim()
    ) {

      return response.message.trim();

    }


    /*
     * Support ASP.NET ProblemDetails.
     */
    if (
      typeof response?.detail === 'string' &&
      response.detail.trim()
    ) {

      return response.detail.trim();

    }


    if (
      typeof response?.title === 'string' &&
      response.title.trim()
    ) {

      return response.title.trim();

    }


    /*
     * Support validation errors.
     */
    if (
      response?.errors &&
      typeof response.errors === 'object'
    ) {

      for (
        const key of Object.keys(response.errors)
      ) {

        const value =
          response.errors[key];


        if (
          Array.isArray(value) &&
          value.length > 0
        ) {

          return String(value[0]);

        }


        if (
          typeof value === 'string' &&
          value.trim()
        ) {

          return value.trim();

        }

      }

    }


    /*
     * Only when API doesn't provide
     * any usable message.
     */
    return fallback;

  }


  // =========================================================
  // TOAST
  // =========================================================

  private showError(
    message: string
  ): void {

    this.clearToastTimer();

    this.successMessage = '';

    this.errorMessage = message;

    this.cdr.detectChanges();


    this.toastTimer =
      setTimeout(() => {

        this.errorMessage = '';

        this.cdr.detectChanges();

      }, 4000);

  }


  private showSuccess(
    message: string
  ): void {

    this.clearToastTimer();

    this.errorMessage = '';

    this.successMessage = message;

    this.cdr.detectChanges();

  }


  clearError(): void {

    this.errorMessage = '';

    this.clearToastTimer();

    this.cdr.detectChanges();

  }


  clearSuccess(): void {

    this.successMessage = '';

    this.clearToastTimer();

    this.cdr.detectChanges();

  }


  private clearToasts(): void {

    this.errorMessage = '';

    this.successMessage = '';

    this.clearToastTimer();

  }


  private clearToastTimer(): void {

    if (this.toastTimer) {

      clearTimeout(this.toastTimer);

      this.toastTimer = undefined;

    }

  }


  ngOnDestroy(): void {

    this.clearToastTimer();

  }

}