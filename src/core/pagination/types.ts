import { ApiSuccessResponse } from '../types'

export interface PaginationOptions {
  limit: number
  offset: number
}

export interface PaginationMetaResponse {
  page: number
  count: number
  pageSize: number
}

export interface PaginatedResponse<T extends unknown = unknown> {
  items: T[]
  pagination: PaginationOptions & { count: number }
}

export interface ApiPaginatedResponse<T = unknown> extends ApiSuccessResponse {
  result: T[]
  pagination: PaginationMetaResponse
}

export function isPaginatedResponse(
  content: any
): content is PaginatedResponse {
  if (typeof content !== 'object' || Array.isArray(content)) {
    return false
  }

  return (
    Array.isArray((content as PaginatedResponse).items) &&
    typeof (content as PaginatedResponse).pagination === 'object'
  )
}
