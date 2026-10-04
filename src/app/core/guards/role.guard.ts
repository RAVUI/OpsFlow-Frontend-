import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';


export const roleGuard: CanActivateFn = route => {

  const router = inject(Router);

  const userJson =
    localStorage.getItem('opsflow_user');


  /* USER NOT FOUND */

  if (!userJson) {

    return router.createUrlTree([
      '/login'
    ]);
  }


  let user: any;

  try {

    user = JSON.parse(userJson);

  } catch {

    localStorage.removeItem(
      'opsflow_user'
    );

    localStorage.removeItem(
      'opsflow_access_token'
    );

    return router.createUrlTree([
      '/login'
    ]);
  }


  const allowedRoles =
    route.data?.['roles'] as string[];


  /* ROLE ALLOWED */

  if (
    user?.role &&
    allowedRoles?.includes(user.role)
  ) {

    return true;
  }


  /* =====================================================
     ROLE BASED FALLBACK
  ===================================================== */

  switch (user?.role) {

    case 'Manager':

      return router.createUrlTree([
        '/dashboard'
      ]);


    case 'Employee':

      return router.createUrlTree([
        '/assigned-issues'
      ]);


    case 'User':

      return router.createUrlTree([
        '/my-issues'
      ]);


    default:

      localStorage.removeItem(
        'opsflow_user'
      );

      localStorage.removeItem(
        'opsflow_access_token'
      );

      return router.createUrlTree([
        '/login'
      ]);
  }
};