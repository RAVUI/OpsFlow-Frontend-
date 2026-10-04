import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

import { LayoutComponent } from './layout/layout.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import {AllIssuesComponent} from './pages/claims/all-issues/all-issues.component';

import {
  MyIssuesComponent
} from './pages/claims/my-issues/my-issues.component';

import {
  AssignedIssuesComponent
} from './pages/claims/assigned-issues/assigned-issues.component';

import { authGuard }
  from './core/guards/auth.guard';

import { roleGuard }
  from './core/guards/role.guard';


export const routes: Routes = [

  /* =====================================================
     PUBLIC
  ===================================================== */

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },


  /* =====================================================
     AUTHENTICATED APPLICATION
  ===================================================== */

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],

    children: [

      /* ================= MANAGER ================= */

      {
        path: 'dashboard',

        component: DashboardComponent,

        canActivate: [roleGuard],

        data: {
          roles: ['Manager']
        }
      },


      {
  path: 'all-issues',
  component: AllIssuesComponent,
  canActivate: [roleGuard],
  data: {
    roles: ['Manager']
  }
},


      {
        path: 'users',

        component: UsersComponent,

        canActivate: [roleGuard],

        data: {
          roles: ['Manager']
        }
      },


      /* ================= USER ================= */

      {
        path: 'my-issues',

        component: MyIssuesComponent,

        canActivate: [roleGuard],

        data: {
          roles: ['User']
        }
      },


      /* ================= EMPLOYEE ================= */

      {
        path: 'assigned-issues',

        component: AssignedIssuesComponent,

        canActivate: [roleGuard],

        data: {
          roles: ['Employee']
        }
      },


      /* ================= DEFAULT ================= */

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }

    ]
  },


  /* =====================================================
     UNKNOWN ROUTE
  ===================================================== */

  {
    path: '**',
    redirectTo: 'login'
  }

];