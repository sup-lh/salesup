import { SetMetadata } from '@nestjs/common';

export const AUTH_PERMISSION_KEY = 'auth:permission';
export const AUTH_LOGIN_REQUIRED_KEY = 'auth:login-required';
export interface PermissionRequirement {
  action: string;
  subject: string;
}

export const Can = (action: string, subject: string) =>
  SetMetadata(AUTH_PERMISSION_KEY, { action, subject } satisfies PermissionRequirement);

export const NeedLogin = () => SetMetadata(AUTH_LOGIN_REQUIRED_KEY, true);
