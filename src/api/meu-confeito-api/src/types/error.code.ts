export type ClientErrorCode =
  | 'ROUTE_DOES_NOT_EXIST'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'PAYLOAD_TOO_LARGE';

export type ResourceErrorCode =
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'RESOURCE_STATE_CONFLICT'
  | 'RESOURCE_GONE';

export type UserErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'USER_INVALID_PASSWORD'
  | 'USER_ACCOUNT_GONE'
  | 'USER_PHONE_NUMBER_REQUIRED';

export type AuthErrorCode =
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_ACCESS_TOKEN_MISSING'
  | 'AUTH_REFRESH_TOKEN_MISSING'
  | 'AUTH_INSUFFICIENT_PERMISSIONS';

export type SystemErrorCode =
  | 'INTERNAL_SERVER_ERROR'
  | 'DATABASE_CONNECTION_FAILED'
  | 'EXTERNAL_SERVICE_TIMEOUT';

export type AppErrorCode =
  | ClientErrorCode
  | ResourceErrorCode
  | UserErrorCode
  | AuthErrorCode
  | SystemErrorCode;
