import type { Role } from '../generated/prisma/client';

declare global {
  namespace Express {
    export interface Request {
      userId: string;
      userRole: Role;
    }
  }
}
