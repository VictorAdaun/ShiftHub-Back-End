import deepmerge from 'deepmerge'
import { getMetadataArgsStorage, Action } from 'routing-controllers'


/**
 * Decorator that adds the `offset` and `limit` query parameters to a
 * controller method.
 */
export function PaginationQueryParams(
  { defaultLimit }: { defaultLimit: number } = { defaultLimit: 300 }
) {
  return function (object: Object, method: string, index: number) {
    getMetadataArgsStorage().params.push({
      object,
      method,
      index,
      type: 'custom-converter',
      parse: false,
      required: false,
      transform: ({ request }: Action) => {
        const offset = parseInt(request.query?.offset) || 0
        const limit = parseInt(request.query?.limit) || defaultLimit

        return { offset, limit }
      },
    })
  }
}
