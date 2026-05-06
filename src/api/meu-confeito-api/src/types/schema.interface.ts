interface Schema {
  parseAsync: (data: unknown) => Promise<any>;
}

export interface ValidationSchemas {
  params?: Schema;
  body?: Schema;
  headers?: Schema;
}
