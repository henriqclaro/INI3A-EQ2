import prisma from '../config/database';
import { ConflictError, ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { IngredientDTO } from '../types/dtos/ingredient.dto';

export class IngredientService {
  private checkPermission(context: RequestContext, id: string) {
    if (context.userId !== id && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: IngredientDTO.RegisterRequest) {
    this.checkPermission(context, data.creatorId);

    const ingredientExists = await prisma.ingredient.findUnique({
      where: { name: data.name },
    });

    if (ingredientExists) {
      throw new ConflictError('Ingredient already exists', 'RESOURCE_ALREADY_EXISTS');
    }

    const parentExists = await prisma.ingredient.findUnique({
      where: { id: data.parentId },
    });

    if (!parentExists) {
      throw new NotFoundError('Parent ingredient does not exist', 'RESOURCE_NOT_FOUND');
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        parentId: data.parentId,
        name: data.name,
        description: data.description,
        category: data.category,
        creatorId: data.creatorId,
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        category: true,
        creatorId: true,
        createdAt: true,
      },
    });

    return { ingredient };
  }
}
