import bcrypt from 'bcrypt';

import prisma from '../config/database';
import { ConflictError } from '../responses/http.error';
import type { UserDTO } from '../types/dtos/user.dto';

export class UserService {
  async register(data: UserDTO.RegisterRequest) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictError('Email already in use', 'USER_ALREADY_EXISTS');
    }

    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
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

    const userData = {
      user: newUser,
    };

    return userData;
  }
}
