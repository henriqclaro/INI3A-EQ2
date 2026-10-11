import type { Role } from '../generated/prisma/client';

declare global {
  namespace Express {
    export interface Request {
      id?: string;
      userId: string;
      userRole: Role;
    }
  }
}
