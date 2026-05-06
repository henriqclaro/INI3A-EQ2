import bcrypt from 'bcrypt';
import { is } from 'zod/v4/locales/index.js';

import prisma from '../config/database';
import { env } from '../config/env.config';
import type { UserModel } from '../generated/prisma/models';
import { AuthError, ConflictError, GoneError, NotFoundError } from '../responses/http.error';
import type { UserDTO } from '../types/dtos/user.dto';

export class UserService {
  private checkUser(
    user: Pick<UserModel, 'isActive'> | null,
  ): asserts user is Pick<UserModel, 'isActive'> {
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }
  }

  async register(data: UserDTO.RegisterRequest) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictError('Email already in use', 'USER_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { user };
  }

  async select(id: string) {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pfpUrl: true,
        role: true,
        updatedAt: true,
        isActive: true,
      },
    });

    this.checkUser(user);

    return { user };
  }

  async update(id: string, data: UserDTO.UpdateRequest) {
    const user = await prisma.user.update({
      where: { id: id },
      data: data,
      select: {
        name: true,
        email: true,
        phone: true,
        pfpUrl: true,
        updatedAt: true,
        isActive: true,
      },
    });

    this.checkUser(user);

    return { user };
  }

  async delete(id: string, data: UserDTO.DeleteRequest) {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        isActive: true,
      },
    });

    this.checkUser(user);

    const isSuspended = data.state === 'SUSPENDED';

    await prisma.user.update({
      where: { id: id },
      data: {
        isActive: false,

        name: `${data.state}_user`,
        email: isSuspended ? undefined : `${data.state}_${id}@anonymized.local`,
        phone: isSuspended ? undefined : null,
        pfpUrl: null,
        providerId: null,
        passwordHash: 'DELETED',
      },
    });
  }
}
