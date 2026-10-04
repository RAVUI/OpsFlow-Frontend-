import {
  ChangeDetectorRef,
  Component,
  HostListener
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { CommonModule } from '@angular/common';

import { filter } from 'rxjs';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  sidebarCollapsed = false;

  profileOpen = false;

  currentUrl = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.currentUrl =
      this.router.url;

    this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(
        (event: NavigationEnd) => {

          this.currentUrl =
            event.urlAfterRedirects;

          /*
           * Page navigation complete.
           * Force UI state detection.
           */
          this.cdr.detectChanges();
        }
      );
  }


  get user() {
    return this.authService.getUser();
  }


  /**
   * O mark meeda click cheste
   * sidebar open / close avutundi.
   */
  toggleSidebar(): void {

    this.sidebarCollapsed =
      !this.sidebarCollapsed;

    this.profileOpen = false;

    this.cdr.detectChanges();
  }


  /**
   * Profile popover open / close
   */
  toggleProfile(
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.profileOpen =
      !this.profileOpen;

    this.cdr.detectChanges();
  }


  /**
   * Outside click ayithe
   * profile popover close.
   */
  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (!this.profileOpen) {
      return;
    }

    const target =
      event.target as HTMLElement;

    if (
      target.closest(
        '.profile-wrapper'
      )
    ) {
      return;
    }

    this.profileOpen = false;

    this.cdr.detectChanges();
  }


  logout(): void {

    this.profileOpen = false;

    this.authService.logout();
  }


  /**
   * Optional helper.
   * Current route ni UI ki expose cheyadaniki.
   */
  isActive(
    route: string
  ): boolean {

    return this.currentUrl
      .startsWith(route);
  }
}