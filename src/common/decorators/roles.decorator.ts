import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  PROFESSIONAL = 'professional',
  RECEPTIONIST = 'receptionist',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
