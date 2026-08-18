---
name: create-endpoint
description: >-
  Use this skill when creating or implementing a new API endpoint or route in the meu-confeito-api backend.
  Guides through schema validation with Zod, DTO definitions, service business logic, controller methods,
  route registration, response classes, and Definition of Done (DoD) verification.
---

# Create Endpoint Skill

This skill guides the end-to-end implementation of a new API endpoint in **Meu Confeito API**, ensuring strict adherence to the project architecture, naming conventions, type safety, and Definition of Done.

---

## Architecture & Request Flow

Every request follows the strict unidirectional flow:

$$\text{Routes} \longrightarrow \text{Middlewares / Zod Validation} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Database (Prisma / SQL)}$$

### Code Conventions & Language Rules

- **Code:** Always written in **English** (variables, functions, classes, types, file names, comments).
- **Documentation:** Summaries, tags, and descriptions must be in **Portuguese** (in YAML docs).
- **Typing:** Strict typing required. Avoid `any` except in raw SQL queries (`$queryRaw`).
- **File Naming:** Kebab-case with middle extensions (e.g., `recipe.route.ts`, `recipe.controller.ts`, `recipe.service.ts`, `recipe.schema.ts`, `recipe.dto.ts`).

---

## Step-by-Step Implementation Guide

### Step 1: Check Database Schema & Prisma Models

Inspect `prisma/schema.prisma` to confirm the required models, relations, and fields exist.

> [!CAUTION]
> Do NOT execute destructive database operations or modify migrations without explicit user authorization.

---

### Step 2: Define Zod Validation Schemas

Create or update schemas in `src/validation/[module].schema.ts`.

1. Define schemas for request payloads, route parameters, query parameters, or headers:

   ```typescript
   import { z } from 'zod';

   export const paramsSchema = z.object({
     id: z.uuid('Invalid UUID for ID'),
   });

   export const registerSchema = z.object({
     title: z.string().min(3, 'Title must have at least 3 characters'),
     baseYield: z.number('Base yield must be a number'),
     yieldUnit: z.string('Yield unit is required'),
   });

   export const querySchema = z.object({
     page: z
       .string()
       .optional()
       .transform((val) => (val ? parseInt(val, 10) : 0))
       .pipe(z.number().int()),
     search: z.string('Search query must be a string').trim().optional(),
   });
   ```

2. Ensure the module is exported in `src/validation/index.ts`:
   ```typescript
   export * as [module] from './[module].schema';
   ```
   _(This ensures `swagger.config.ts` automatically registers OpenAPI schemas under `[Module][Schema]` format, e.g. `RecipeRegisterSchema`)._

---

### Step 3: Define DTO Types

Create or update DTO interfaces in `src/types/dtos/[module].dto.ts` inside a dedicated namespace:

```typescript
import type { z } from 'zod';
import type * as [module] from '../../validation/[module].schema';

export namespace [Module]DTO {
  // Request DTOs inferred from Zod schemas
  export type RequestParams = z.infer<typeof [module].paramsSchema>;
  export type RegisterRequest = z.infer<typeof [module].registerSchema>;
  export type QueryRequest = z.infer<typeof [module].querySchema>;

  // Response DTO interfaces matching JSON response payloads
  export interface RegisterResponse {
    [resource]: {
      id: string;
      title: string;
      createdAt: Date;
    };
  }

  export interface SelectResponse {
    [resource]: {
      id: string;
      title: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
```

---

### Step 4: Implement Service Business Logic

Create or update `src/services/[module].service.ts`:

1. Inject `prisma` from `../config/database`.
2. Check user permissions using `RequestContext` when accessing or mutating user-scoped data.
3. Use domain-specific error classes from `src/responses/http.error`:
   - `NotFoundError('Resource not found', 'RESOURCE_NOT_FOUND')` (404)
   - `ForbiddenError('Action denied for lack of privileges', 'AUTH_INSUFFICIENT_PERMISSIONS')` (403)
   - `ConflictError('Data conflict error', 'RESOURCE_ALREADY_EXISTS')` (409)
   - `GoneError('Resource gone', 'RESOURCE_GONE')` (410)
   - `DefaultAppError('Invalid format/request', 'INVALID_FORMAT')` (400)
4. Return an object matching the response DTO.

```typescript
import prisma from '../config/database';
import { ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { [Module]DTO } from '../types/dtos/[module].dto';

export class [Module]Service {
  private checkPermission(context: RequestContext, ownerId: string) {
    if (context.userId !== ownerId && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: [Module]DTO.RegisterRequest) {
    const created = await prisma.[model].create({
      data: {
        ...data,
        userId: context.userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return { [resource]: created };
  }

  async selectSingle(context: RequestContext, id: string) {
    const item = await prisma.[model].findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('[Resource] not found', 'RESOURCE_NOT_FOUND');
    }

    return { [resource]: item };
  }
}
```

---

### Step 5: Implement Controller

Create or update `src/controllers/[module].controller.ts`:

1. Instantiate the service.
2. Extract context via `extractProps(req: Request)`: `{ userId: req.userId, userRole: req.userRole }`.
3. Type the request and response with `Request<Params, ResBody, ReqBody, ReqQuery>` and `Response<ApiResponse<DTO>>`.
4. Send standardized responses using classes from `src/responses/http.success`:
   - `CreatedResponse(res, responseData, 'Message').send()` (201 Created)
   - `DefaultSuccessResponse(res, responseData, 'Message').send()` (200 OK)
   - `NoContentResponse(res, 'Message').send()` (204 No Content)

```typescript
import type { Request, Response } from 'express';
import {
  CreatedResponse,
  DefaultSuccessResponse,
  NoContentResponse,
} from '../responses/http.success';
import { [Module]Service } from '../services/[module].service';
import type { ApiResponse } from '../types/api.response';
import type { [Module]DTO } from '../types/dtos/[module].dto';

export class [Module]Controller {
  private [module]Service: [Module]Service;

  constructor() {
    this.[module]Service = new [Module]Service();
  }

  private extractProps(req: Request) {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async register(
    req: Request<unknown, unknown, [Module]DTO.RegisterRequest>,
    res: Response<ApiResponse<[Module]DTO.RegisterResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.[module]Service.register(context, req.body);

    return new CreatedResponse(res, responseData, '[Resource] created successfully').send();
  }

  async selectSingle(
    req: Request<[Module]DTO.RequestParams>,
    res: Response<ApiResponse<[Module]DTO.SelectResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.[module]Service.selectSingle(context, req.params.id);

    return new DefaultSuccessResponse(res, responseData, '[Resource] selected successfully').send();
  }
}
```

---

### Step 6: Configure and Register Routes

1. In `src/routes/[module].route.ts`:
   - Use `authMiddleware` for protected routes.
   - Attach `validate({ body, params, query, headers })` passing the Zod schemas.
   - Bind controller methods (`controller.method.bind(controller)`).

   ```typescript
   import { Router } from 'express';
   import { [Module]Controller } from '../controllers/[module].controller';
   import { authMiddleware } from '../middlewares/auth.middleware';
   import { validate } from '../middlewares/validate.middleware';
   import * as [module] from '../validation/[module].schema';

   const [module]Routes = Router();
   const [module]Controller = new [Module]Controller();

   [module]Routes.use(authMiddleware);

   [module]Routes.post(
     '/',
     validate({ body: [module].registerSchema }),
     [module]Controller.register.bind([module]Controller),
   );

   [module]Routes.get(
     '/:id',
     validate({ params: [module].paramsSchema }),
     [module]Controller.selectSingle.bind([module]Controller),
   );

   export { [module]Routes };
   ```

2. Register the module route in `src/routes/index.ts` if not already registered:
   ```typescript
   import { [module]Routes } from './[module].route';

   routes.use('/[module]s', [module]Routes);
   ```

---

### Step 7: Generate OpenAPI Documentation

Invoke or follow the `generate-docs` skill to create:

1. Response schema component in `src/docs/components/[module].component.yaml`.
2. Endpoint path definition in `src/docs/[module].doc.yaml` (descriptions, summaries, and tags in Portuguese).

---

## Step 8: Definition of Done (DoD) Verification

Always execute the following verification steps before completing the task:

1. **Typecheck:**
   ```bash
   npx tsc --noEmit
   ```
2. **Linting:**
   ```bash
   npx eslint <modified-file>
   # or full project:
   npx eslint src/
   ```
3. **Prettier Formatting:**
   ```bash
   npx prettier --write <modified-file>
   ```
