import { Role } from '@prisma/client';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
}

export interface UserSafe {
  id: string;
  email: string;
  name: string;
  role: Role;
}
