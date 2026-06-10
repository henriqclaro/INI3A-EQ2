interface Schema {
  parseAsync: (data: unknown) => Promise<any>;
}

export interface ValidationSchemas {
  headers?: Schema;
  params?: Schema;
  body?: Schema;
  query?: Schema;
}
