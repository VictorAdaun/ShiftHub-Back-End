import { InterceptorInterface, Interceptor } from 'routing-controllers'
import { Service } from 'typedi'

import { ApiSuccessResponse } from '../core/types'

@Interceptor()
@Service()
export class ApiResponseMiddleware implements InterceptorInterface {
  /**
   * Wraps a successful response in the common api wrapper.
   */
  intercept(_: any, content: any): ApiSuccessResponse | null | undefined {
    // Don't wrap null or undefined because it interferes with the `@OnNull`
    // and `@OnUndefined` decorators.
    if (content === null || content === undefined) {
      return content
    }

    return {
      isError: false,
      result: content,
    }
  }
}
