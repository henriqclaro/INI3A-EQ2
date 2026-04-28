export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/*
export interface ApiError<_> {
  success: false;
  errors?: any[];
  message?: string;
  data: never;
}

export interface ApiSuccess<T> {
  success: true;
  errors: never;
  message?: string;
  data?: T;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError<T>;
*/