import prisma from '../config/database';
import { ConflictError, ForbiddenError, GoneError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { ShowcaseDTO } from '../types/dtos/showcase.dto';

export class ShowcaseService {
  private async ensureUserActive(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }
  }

  async listPublic(context: RequestContext, profileId: string): Promise<ShowcaseDTO.ListResponse> {
    await this.ensureUserActive(context.userId);

    const profile = await prisma.bakerProfile.findUnique({
      where: { userId: profileId },
      select: {
        userId: true,
        user: {
          select: { isActive: true },
        },
      },
    });

    if (!profile || !profile.user.isActive) {
      throw new NotFoundError('Baker profile not found', 'RESOURCE_NOT_FOUND');
    }

    const showcase = await prisma.showcaseRecipe.findMany({
      where: {
        userId: profileId,
        recipe: {
          status: 'PUBLISHED',
        },
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        userId: true,
        recipeId: true,
        order: true,
        createdAt: true,
        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    });

    return { showcase };
  }

  async listMine(context: RequestContext): Promise<ShowcaseDTO.ListResponse> {
    await this.ensureUserActive(context.userId);

    const showcase = await prisma.showcaseRecipe.findMany({
      where: { userId: context.userId },
      orderBy: {
        order: 'asc',
      },
      select: {
        userId: true,
        recipeId: true,
        order: true,
        createdAt: true,
        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            averageRating: true,
            totalReviews: true,
            status: true,
          },
        },
      },
    });

    return { showcase };
  }

  async add(
    context: RequestContext,
    data: ShowcaseDTO.AddRequest,
  ): Promise<ShowcaseDTO.ShowcaseItemResponse> {
    await this.ensureUserActive(context.userId);

    const profile = await prisma.bakerProfile.findUnique({
      where: { userId: context.userId },
      select: { userId: true },
    });

    if (!profile) {
      throw new ForbiddenError(
        'Baker profile is required to manage showcase',
        'AUTH_INSUFFICIENT_PERMISSIONS',
      );
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
      select: { id: true, userId: true, status: true },
    });

    if (!recipe) {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (recipe.userId !== context.userId) {
      throw new ForbiddenError(
        'Action denied for lack of privileges',
        'AUTH_INSUFFICIENT_PERMISSIONS',
      );
    }

    if (recipe.status !== 'PUBLISHED') {
      throw new ConflictError(
        'Only published recipes can be added to showcase',
        'RESOURCE_STATE_CONFLICT',
      );
    }

    const existingShowcase = await prisma.showcaseRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId: data.recipeId,
        },
      },
    });

    if (existingShowcase) {
      throw new ConflictError('Recipe is already in showcase', 'RESOURCE_ALREADY_EXISTS');
    }

    let assignedOrder = data.order;
    if (assignedOrder === undefined || assignedOrder === null) {
      const count = await prisma.showcaseRecipe.count({
        where: { userId: context.userId },
      });
      assignedOrder = count + 1;
    }

    const created = await prisma.showcaseRecipe.create({
      data: {
        userId: context.userId,
        recipeId: data.recipeId,
        order: assignedOrder,
      },
      select: {
        userId: true,
        recipeId: true,
        order: true,
        createdAt: true,
        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    });

    return { showcaseItem: created };
  }

  async reorder(
    context: RequestContext,
    data: ShowcaseDTO.ReorderRequest,
  ): Promise<ShowcaseDTO.ListResponse> {
    await this.ensureUserActive(context.userId);

    const existingItems = await prisma.showcaseRecipe.findMany({
      where: { userId: context.userId },
      select: { recipeId: true },
    });

    const existingRecipeIds = new Set(existingItems.map((item) => item.recipeId));

    for (const item of data.items) {
      if (!existingRecipeIds.has(item.recipeId)) {
        throw new NotFoundError(
          `Recipe ${item.recipeId} not found in showcase`,
          'RESOURCE_NOT_FOUND',
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        await tx.showcaseRecipe.update({
          where: {
            userId_recipeId: {
              userId: context.userId,
              recipeId: item.recipeId,
            },
          },
          data: {
            order: item.order,
          },
        });
      }
    });

    return this.listMine(context);
  }

  async remove(context: RequestContext, recipeId: string): Promise<void> {
    await this.ensureUserActive(context.userId);

    const existing = await prisma.showcaseRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Showcase recipe not found', 'RESOURCE_NOT_FOUND');
    }

    await prisma.showcaseRecipe.delete({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId,
        },
      },
    });
  }
}
