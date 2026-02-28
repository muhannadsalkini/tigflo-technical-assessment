import { Role } from '@prisma/client';

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}
