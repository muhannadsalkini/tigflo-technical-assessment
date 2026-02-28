import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { findByEmail } from '../users/user.service';
import { RegisterBody, LoginBody, AuthUser, LoginResult } from './auth.types';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

export async function register(body: RegisterBody): Promise<AuthUser> {
  const existing = await findByEmail(body.email);

  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await hashPassword(body.password);

  return prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      name: body.name,
      role: body.role,
    },
    select: USER_SAFE_SELECT,
  });
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const user = await findByEmail(body.email);

  // Use a constant-time comparison path to avoid user enumeration
  if (!user || !(await comparePassword(body.password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
