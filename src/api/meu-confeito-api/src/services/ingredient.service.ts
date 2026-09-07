import prisma from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { ConflictError, ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { IngredientDTO } from '../types/dtos/ingredient.dto';
import { generateSlug } from '../utils/slugify.util';

export class IngredientService {
  private checkPermission(context: RequestContext) {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'BAKER') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: IngredientDTO.RegisterRequest) {
    this.checkPermission(context);

    const creatorId = context.userRole === 'ADMIN' ? null : context.userId;
    const slug = data.slug || generateSlug(data.name);

    const existingIngredient = creatorId
      ? await prisma.ingredient.findUnique({
          where: { creatorId_slug: { creatorId, slug } },
        })
      : await prisma.ingredient.findFirst({
          where: { creatorId: null, slug },
        });

    if (existingIngredient) {
      throw new ConflictError(
        'Ingredient with this slug already exists for this creator',
        'RESOURCE_ALREADY_EXISTS',
      );
    }

    if (data.parentId) {
      const parentExists = await prisma.ingredient.findUnique({
        where: { id: data.parentId },
      });

      if (!parentExists) {
        throw new NotFoundError('Parent ingredient does not exist', 'RESOURCE_NOT_FOUND');
      }
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        parentId: data.parentId,
        name: data.name,
        slug,
        aliases: data.aliases ?? [],
        description: data.description,
        category: data.category,
        baseDimension: data.baseDimension,
        baseUnit: data.baseUnit,
        creatorId,
        conversions: data.conversions?.length
          ? {
              create: data.conversions.map((conv) => ({
                fromUnit: conv.fromUnit,
                factorToBase: conv.factorToBase,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        slug: true,
        aliases: true,
        description: true,
        category: true,
        baseDimension: true,
        baseUnit: true,
        creatorId: true,
        createdAt: true,
        conversions: {
          select: {
            id: true,
            fromUnit: true,
            factorToBase: true,
          },
        },
      },
    });

    return { ingredient };
  }

  async search(context: RequestContext, query?: IngredientDTO.QueryRequest) {
    const search = query?.search;
    const page = query?.page;
    const category = query?.category;
    const baseDimension = query?.baseDimension;

    const baseFilter: Prisma.IngredientWhereInput = {
      OR: [{ creatorId: null }, { creatorId: context.userId }],
    };

    const conditions: Prisma.IngredientWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { aliases: { has: search.toLowerCase() } },
        ],
      });
    }

    if (category) {
      conditions.push({
        category: { equals: category, mode: 'insensitive' },
      });
    }

    if (baseDimension) {
      conditions.push({
        baseDimension: { equals: baseDimension },
      });
    }

    if (conditions.length > 0) {
      baseFilter.AND = conditions;
    }

    const safePage = Number(page);
    const skipValue = !isNaN(safePage) && safePage > 0 ? safePage * 15 : 0;

    const ingredients = await prisma.ingredient.findMany({
      where: baseFilter,
      take: 15,
      skip: skipValue,
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        aliases: true,
        baseDimension: true,
        baseUnit: true,
        category: true,
        description: true,
      },
    });

    return { ingredients };
  }
}
