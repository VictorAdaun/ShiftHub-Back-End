import { Response, NextFunction } from 'express'
import {
  Middleware,
  ExpressErrorMiddlewareInterface,
} from 'routing-controllers'
import { Service } from 'typedi'

import { config } from '../config/config'
import { ErrorHandler } from '../core/errors/errorHandler'

@Middleware({ type: 'after', priority: 100 })
@Service()
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  private errorHandler: ErrorHandler

  constructor() {
    const isDevelopment = config.get('ENV') !== 'production'
    this.errorHandler = new ErrorHandler(isDevelopment)
  }

  /**
   * Formats any thrown error in the common api error format. The default error
   * handler must be turned off for this to work.
   */
  error(error: any, _: unknown, response: Response, next: NextFunction) {
    if (typeof error === 'string') {
      error = new Error(error)
    }

    const { status, json, shouldReport } = this.errorHandler.handleError(error)
    error.shouldReport = shouldReport
    error.statusCode = status
    error.response = json

    response.status(status)
    response.json(json)
    next(error)
  }
}
