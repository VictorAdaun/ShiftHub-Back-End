export interface ApiSuccessResponse {
  isError: false;
  result: unknown;
}

export interface ApiErrorResponse {
  isError: true;
  name: string;
  message: string;
  data?: AnyDict;
  stack?: string;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export type AnyDict = { [k: string]: any };
