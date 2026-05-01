import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import prisma from '../config/database';
import { AuthError } from '../responses/http.error';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthService {
  async logIn(data: AuthDTO.LogInRequest) {
    const foundUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        name: true,
        phone: true,
        pfpUrl: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!foundUser) {
      throw new AuthError('Invalid credentials', 'AUTH_UNAUTHORIZED');
    }

    const isMatch = await bcrypt.compare(data.password, foundUser.passwordHash);

    if (!isMatch) {
      throw new AuthError('Invalid credentials', 'AUTH_UNAUTHORIZED');
    }

    const user = {
      name: foundUser.name,
      email: data.email,
      phone: foundUser.phone,
      pfpUrl: foundUser.pfpUrl,
    };

    const payload = {
      id: foundUser.id,
      role: foundUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    const userData: AuthDTO.LogInResponse = {
      user,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    };

    return userData;
  }
}
