import { PaginationMetaResponse, PaginationOptions } from './types'

export * from './types'
export * from './decorators'

export function generatePaginationResponse({
  count,
  offset,
  limit,
}: PaginationOptions & { count: number }): PaginationMetaResponse {
  const page = Math.ceil(offset / limit) + 1

  return { page, count, pageSize: limit }
}
