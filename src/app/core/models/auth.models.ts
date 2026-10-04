export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: 'User' | 'Employee' | 'Manager';
  organizationId: string;
  organizationName: string;
  location?: string;
}

export interface AuthUser {
  accessToken: string;
  user: UserProfile;
}

export interface UserProfile {

  userId: string;

  name: string;

  email: string;

  role:
    | 'User'
    | 'Employee'
    | 'Manager';

  organizationId: string;

  organizationName: string;

  location?: string;
}

export interface Organization {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationId: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  employee: {
    userId: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    location: string;
  };
}