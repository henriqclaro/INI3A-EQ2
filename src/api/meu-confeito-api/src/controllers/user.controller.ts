import type { Request, Response } from 'express';

import bcrypt from 'bcrypt';
import { z } from 'zod';

import { prisma } from '../config/database';
import { type RegisterUserRequest, resgisterUserSchema } from '../dtos/user.dto';
import { AppError, ValidationError } from '../errors/app.error';

export class UserController {
  async register(req: Request<any, any, RegisterUserRequest>, res: Response) {
    try {
      const parsedData = resgisterUserSchema.parse(req.body);

      const userExists = await prisma.user.findUnique({
        where: { email: parsedData.email },
      });

      if (userExists) {
        return new AppError(409, 'Email already in use.');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(parsedData.password, saltRounds);

      const user = await prisma.user.create({
        data: {
          name: parsedData.name,
          email: parsedData.email,
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      const data = {
        message: 'User created successfully.',
        user,
      };

      return res.status(201).json(data);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        //return new AppError(400, `Invalid data: ${z.treeifyError(error)}`);
        return new ValidationError('Invalid data.', [z.treeifyError(error)]);
      }

      console.error('[UserController.register] Internal error: ', error);
      return new AppError(500, 'Internal Server Error');
    }
  }
}
