import bcrypt from 'bcrypt';

import prisma from '../config/database';
import type { RegisterUserRequest } from '../dtos/user.dto';
import { ConflictError } from '../errors/http.error';

export class UserService {
  async register(data: RegisterUserRequest) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictError('Email already in use.', 'USER_ALREADY_EXISTS');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return newUser;
  }
}
