import type { Role } from '../generated/prisma/client';

export interface RequestContext {
  userId: string;
  userRole: Role;
}
