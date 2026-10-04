import { ChangeDetectorRef, Component } from '@angular/core';
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

import { finalize, timeout } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

type LoginState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;

  loading = false;
  showPassword = false;

  errorMessage = '';
  loginState: LoginState = 'idle';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.loginForm = this.fb.group({

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      password: ['', [
        Validators.required
      ]]

    });

  }


  login(): void {

    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.loginState = 'idle';

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      this.cdr.detectChanges();

      return;
    }

    this.loading = true;
    this.loginState = 'loading';

    this.cdr.detectChanges();


    const request = {
      email: this.email?.value?.trim(),
      password: this.password?.value
    };


    this.authService
      .login(request)
      .pipe(
        timeout(15000),

        finalize(() => {

          this.loading = false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (result) => {

          if (!result?.user) {

            this.loginState = 'error';

            this.errorMessage =
              'Login response is invalid. Please try again.';

            this.cdr.detectChanges();

            setTimeout(() => {

              this.errorMessage = '';
              this.loginState = 'idle';

              this.cdr.detectChanges();

            }, 5000);

            return;
          }


          this.loginState = 'success';
          this.errorMessage = '';

          this.cdr.detectChanges();


          const role = result.user.role;


          if (role === 'Manager') {

            this.router.navigate(['/dashboard']);

            return;
          }


          if (role === 'Employee') {

            this.router.navigate(['/assigned-issues']);

            return;
          }


          this.router.navigate(['/my-issues']);

        },


        error: (error) => {

          this.loginState = 'error';

          this.errorMessage =
            this.getLoginErrorMessage(error);

          this.cdr.detectChanges();


          setTimeout(() => {

            this.errorMessage = '';
            this.loginState = 'idle';

            this.cdr.detectChanges();

          }, 5000);

        }

      });

  }


  togglePassword(): void {

    this.showPassword = !this.showPassword;

    this.cdr.detectChanges();

  }


  private getLoginErrorMessage(error: any): string {

    if (error?.name === 'TimeoutError') {

      return 'The server is taking too long to respond. Please try again.';

    }

    if (error?.status === 0) {

      return 'Unable to connect to the server. Please check your connection and try again.';

    }

    if (error?.status === 401) {

      return 'Invalid email or password. Please check your credentials and try again.';

    }

    if (error?.status === 403) {

      return 'You do not have permission to sign in. Please contact your administrator.';

    }

    if (error?.status === 400) {

      return (
        error?.error?.message ??
        error?.error?.title ??
        'Please check your login details and try again.'
      );

    }

    if (error?.status >= 500) {

      return 'Something went wrong on the server. Please try again later.';

    }

    if (typeof error?.error?.message === 'string') {

      return error.error.message;

    }

    if (typeof error?.error === 'string') {

      return error.error;

    }

    return 'Unable to sign in. Please try again.';

  }


  get email() {

    return this.loginForm.get('email');

  }


  get password() {

    return this.loginForm.get('password');

  }

}