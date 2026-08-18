---
name: generate-docs
description: >-
  Use this skill when creating, updating, or maintaining OpenAPI/Swagger documentation for routes and components in meu-confeito-api.
  Guides OpenAPI 3.0 YAML specification, Portuguese copy guidelines, Zod-to-Swagger schema mapping, and component separation.
---

# Generate OpenAPI/Swagger Docs Skill

This skill guides the documentation of endpoints and components in **Meu Confeito API** using OpenAPI 3.0 YAML specifications consumed by Swagger UI at `/api-docs`.

---

## Documentation Architecture

The documentation system relies on a two-tier YAML structure combined with automated Zod schema discovery:

```text
src/
├── docs/
│   ├── [module].doc.yaml             # Paths, methods, parameters, request bodies & response refs
│   └── components/
│       └── [module].component.yaml   # Response schemas and complex objects
├── config/
│   └── swagger.config.ts             # Dynamically mounts YAMLs and auto-generates Zod schemas
└── validation/
    ├── index.ts                      # Re-exports all domain validation schemas
    └── [module].schema.ts            # Zod validation schemas
```

---

## Critical Documentation Rules

### 1. Language Policy (Portuguese Required)

In accordance with `AGENTS.md`, **all documentation text must be in Portuguese**:

- **`summary`:** Clear, active verb phrase in Portuguese (e.g., `Cadastra um novo usuário`, `Busca e lista receitas`, `Exclui um usuário`).
- **`tags`:** Domain tags in Portuguese (e.g., `Usuários`, `Receitas`, `Ingredientes`, `Autenticação`, `Tags`).
- **Response `description`:** Human-readable status in Portuguese (e.g., `Usuário cadastrado com sucesso`, `Erro na validação dos dados`, `Ação negada por falta de privilégios`, `Receita não encontrada`).

### 2. Automatic Zod Schema Naming

The Swagger config dynamically converts Zod schemas exported in `src/validation/index.ts` to OpenAPI component schemas:

$$\text{Domain Name (PascalCase)} + \text{Schema Name (PascalCase)} \longrightarrow \text{Swagger Component Key}$$

**Examples:**

| Domain (`validation/index.ts`) | Schema (`validation/[module].schema.ts`) | Swagger Ref Key                             |
| :----------------------------- | :--------------------------------------- | :------------------------------------------ |
| `user`                         | `registerSchema`                         | `#/components/schemas/UserRegisterSchema`   |
| `user`                         | `paramsSchema`                           | `#/components/schemas/UserParamsSchema`     |
| `recipe`                       | `registerSchema`                         | `#/components/schemas/RecipeRegisterSchema` |
| `auth`                         | `logInSchema`                            | `#/components/schemas/AuthLogInSchema`      |

---

## Step-by-Step Documentation Workflow

### Step 1: Verify Route & Validation Schemas

1. Review the endpoint route in `src/routes/[module].route.ts` to determine:
   - Relative path (relative to `/api/v1` base URL, e.g., `/users/{id}/recipes`).
   - HTTP method (`get`, `post`, `patch`, `put`, `delete`).
   - Route parameters (e.g., `:id` becomes `{id}` in OpenAPI).
   - Query parameters (e.g., `?page=0&search=bolo`).
2. Ensure the validation schemas are defined in `src/validation/[module].schema.ts` and re-exported in `src/validation/index.ts`.

---

### Step 2: Create / Update Response Component (`src/docs/components/[module].component.yaml`)

Define response schemas corresponding to the DTO response interface under `components.schemas`:

```yaml
components:
  schemas:
    [Module][Action]Response:
      type: object
      properties:
        [resource]:
          type: object
          properties:
            id:
              type: string
              format: uuid
            title:
              type: string
            coverUrl:
              type: string
              format: url
              nullable: true
            prepTimeMinutes:
              type: integer
            createdAt:
              type: string
              format: date-time
            updatedAt:
              type: string
              format: date-time
```

#### OpenAPI 3.0 Type Reference:

- **UUID:** `type: string`, `format: uuid`
- **Date/Time:** `type: string`, `format: date-time`
- **URL:** `type: string`, `format: url`
- **Integer:** `type: integer`
- **Decimal / Float:** `type: number`
- **Optional/Nullable fields:** Include `nullable: true`
- **Enums:** `type: string`, `enum: [OPTION_1, OPTION_2]`
- **Arrays:** `type: array`, `items: { type: object, properties: { ... } }`

---

### Step 3: Create / Update Path Documentation (`src/docs/[module].doc.yaml`)

Define the path operation with tags, parameters, request body, and possible HTTP status responses:

```yaml
paths:
  /[module]s:
    post:
      summary: Cadastra um novo [recurso]
      tags:
        - [Tag em Português]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/[Module]RegisterSchema'
      responses:
        '201':
          description: [Recurso] cadastrado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[Module]RegisterResponse'
        '400':
          description: Erro na validação dos dados
        '403':
          description: Ação negada por falta de privilégios
        '409':
          description: [Recurso] já em uso ou cadastrado

  /[module]s/{id}:
    get:
      summary: Seleciona um [recurso] por ID
      tags:
        - [Tag em Português]
      parameters:
        - in: path
        - name: id
          required: true
          schema:
            $ref: '#/components/schemas/[Module]ParamsSchema'
      responses:
        '200':
          description: [Recurso] selecionado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[Module]SelectResponse'
        '403':
          description: Ação negada por falta de privilégios
        '404':
          description: [Recurso] não encontrado
        '410':
          description: [Recurso] suspenso ou excluído

    delete:
      summary: Exclui um [recurso]
      tags:
        - [Tag em Português]
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/[Module]ParamsSchema'
      responses:
        '204':
          description: [Recurso] excluído com sucesso
        '403':
          description: Ação negada por falta de privilégios
        '404':
          description: [Recurso] não encontrado
```

---

### Step 4: Standard Response Codes Checklist

Ensure documentation covers standard HTTP status codes used across the API:

| Status Code | Standard Portuguese Description                                   | When to Document                                           |
| :---------- | :---------------------------------------------------------------- | :--------------------------------------------------------- |
| **`200`**   | `[Recurso] selecionado / atualizado com sucesso`                  | Successful GET / PATCH / PUT                               |
| **`201`**   | `[Recurso] cadastrado com sucesso`                                | Successful POST creation                                   |
| **`204`**   | `[Recurso] excluído com sucesso` / `Logout realizado com sucesso` | Successful DELETE / No Content                             |
| **`400`**   | `Erro na validação dos dados`                                     | Input validation failures (Zod)                            |
| **`401`**   | `Token inválido ou expirado` / `Credenciais inválidas`            | Authentication endpoints or auth failure                   |
| **`403`**   | `Ação negada por falta de privilégios`                            | Unauthorized resource access / role checks                 |
| **`404`**   | `[Recurso] não encontrado`                                        | Target resource does not exist in DB                       |
| **`409`**   | `[Recurso] já em uso / existente`                                 | Conflict on unique constraints (e.g., email, unique names) |
| **`410`**   | `[Recurso] suspenso ou excluído`                                  | Soft-deleted / inactive accounts or entities               |

---

## Step 5: Verification & Definition of Done (DoD)

1. **Format YAML files with Prettier:**
   ```bash
   npx prettier --write src/docs/[module].doc.yaml src/docs/components/[module].component.yaml
   ```
2. **Verify Schema References:**
   - Double-check that all `$ref` in `paths` point to valid components defined in either `components/schemas` (from `[module].component.yaml`) or auto-generated Zod schemas (`[Module][Schema]`).
