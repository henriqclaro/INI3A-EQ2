interface Schema {
  parseAsync: (data: unknown) => Promise<any>;
}

export interface ValidationSchemas {
  body?: Schema;
  headers?: Schema;
}
