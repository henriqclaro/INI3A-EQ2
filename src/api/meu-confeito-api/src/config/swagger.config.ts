import { type Express } from 'express';

import swaggerJSDoc, { type Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import z from 'zod';

import * as schemas from '../validation/index';

const generateSwaggerSchemas = () => {
  const swaggerComponents: Record<string, any> = {};

  for (const [domainName, domain] of Object.entries(schemas)) {
    for (const [schemaName, schemaValue] of Object.entries(domain as Record<string, any>)) {
      const formattedDomain = domainName.charAt(0).toUpperCase() + domainName.slice(1);

      const formattedSchema = schemaName.charAt(0).toUpperCase() + schemaName.slice(1);

      const swaggerKey = `${formattedDomain}${formattedSchema}`;

      swaggerComponents[swaggerKey] = z.toJSONSchema(schemaValue, { target: 'openapi-3.0' });
    }
  }

  return swaggerComponents;
};

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Meu Confeito',
      version: '1.0.0',
      description: 'Documentação da API gerada com Swagger JSDoc e Swagger Express UI',
    },
    servers: [
      {
        url: '/api/v1',
      },
    ],
    components: {
      schemas: generateSwaggerSchemas(),
    },
  },
  apis: ['./src/docs/**/*.yaml'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
