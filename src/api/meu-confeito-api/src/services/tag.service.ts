import prisma from '../config/database';
import type { Prisma, TagType } from '../generated/prisma/client';
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

  async search(search?: string, page?: number, type?: TagType) {
    const baseFilter: Prisma.TagWhereInput = {};

    if (search) {
      baseFilter.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type) {
      baseFilter.type = type;
    }

    const safePage = Number(page);
    const skipValue = !isNaN(safePage) && safePage > 0 ? safePage * 15 : 0;

    const tags = await prisma.tag.findMany({
      where: baseFilter,
      take: 15,
      skip: skipValue,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        creatorId: true,
        createdAt: true,
      },
    });

    return { tags };
  }
}
