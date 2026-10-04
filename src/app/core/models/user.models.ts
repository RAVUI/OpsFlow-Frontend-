export type UserRole =
  | 'User'
  | 'Employee'
  | 'Manager'
  | 'Admin';


export interface ManagedUser {

  userId: string;

  name: string;

  email: string;

  role: UserRole;

  organizationId: string;

  organizationName: string;

  location: string;

  createdAt: string;
}


export interface OrganizationOption {

  id: string;

  name: string;

  location?: string;

  createdAt?: string;
}