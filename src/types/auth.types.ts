import { Request } from 'express';

export type UserRole = 'admin' | 'pemilik';

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserProfileResponse;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}
