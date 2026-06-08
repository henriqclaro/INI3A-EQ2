import prisma from '../config/database';
import { ConflictError, ForbiddenError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { TagDTO } from '../types/dtos/tag.dto';

export class TagService {
  private checkPermission(context: RequestContext, id: string) {
    if (context.userId !== id && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: TagDTO.RegisterRequest) {
    this.checkPermission(context, data.creatorId);

    const tagExists = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (tagExists) {
      throw new ConflictError('Tag already exists', 'RESOURCE_ALREADY_EXISTS');
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        type: data.tagType,
        creatorId: data.creatorId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        creatorId: true,
      },
    });

    return { tag };
  }
}
