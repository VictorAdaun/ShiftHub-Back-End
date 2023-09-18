import { ValidationError } from 'class-validator'
import {
  BadRequestError,
  HttpError,
  InternalServerError as RoutingControllerInternalServerError,
} from 'routing-controllers'

import { ApiError, InternalServerError } from './errors'
import { logger } from '../logging/logger'
import { ApiErrorResponse, AnyDict } from '../types'

type HandleErrorResult = {
  status: number
  json: ApiErrorResponse
  shouldReport: boolean
}

export class ErrorHandler {
  constructor(private isDevelopment: boolean) {}

  public handleError(error: Error): HandleErrorResult {
    if (!this.isExpectedError(error)) {
      return this.processUnexpectedError(error)
    }

    const status = error.httpCode
    let json = this.processJsonError(error)
    let shouldReport = false

    if (this.isValidationError(error)) {
      json.name = 'ValidationError'
    }

    if (!(error instanceof ApiError)) {
      const { name, message, stack, ...rest } = json
      json = { name, message, stack, isError: true, data: rest }
    }

    if (
      error instanceof InternalServerError ||
      error instanceof RoutingControllerInternalServerError
    ) {
      shouldReport = true
      delete json.data
    }

    if (!this.isDevelopment) {
      delete json.stack
    }

    return { status, json, shouldReport }
  }

  protected wrapJsonError(error: AnyDict): ApiErrorResponse {
    const { name, message, stack, ...rest } = error
    return { name, message, isError: true, data: rest, stack }
  }

  /**
   * When not in isDevelopment only expose error message and name for
   * HttpError and ApiError
   */
  protected processUnexpectedError(error: Error): HandleErrorResult {
    const json = this.isDevelopment
      ? this.wrapJsonError(this.processJsonError(error))
      : {
          isError: true as true,
          name: 'InternalError',
          message: 'An unexpected error occurred',
        }

    // errors generated from class-validation package includes a status code (eg. 400) which should be
    // honored as the problems is an invalid client request input instead of a generic internal server error,
    // this is misleading for api client packages
    return {
      status: json.data?.statusCode ?? 500,
      json,
      shouldReport: true,
    }
  }

  /**
   * Routing-controllers turns the ValidationError into a BadRequestError so we
   * need to inspect the actual error in order to figure out if the issue was
   * validation.
   */
  public isValidationError(error: Error) {
    type CaughtValidationError = BadRequestError & { errors: any[] }

    if (!(error instanceof BadRequestError)) {
      return false
    }

    if (!Array.isArray((error as CaughtValidationError).errors)) {
      return false
    }

    const firstError = (error as CaughtValidationError).errors[0]

    if (firstError instanceof ValidationError) {
      for (const validationError of (error as CaughtValidationError).errors) {
        logger.debug({ validationError })
      }

      return true
    }

    return false
  }

  public isExpectedError(error: Error): error is HttpError | ApiError {
    return error instanceof HttpError || error instanceof ApiError
  }

  /*
   * There's currently no way to modify the errors generated from
   * routing-controllers default error handler so the following code is copied
   * from routing-controllers source.
   *
   */
  public processJsonError(error: any) {
    if (typeof error.toJSON === 'function') return error.toJSON()

    const processedError: any = {}
    if (error instanceof Error) {
      const name =
        error.name && error.name !== 'Error'
          ? error.name
          : error.constructor.name
      processedError.name = name

      if (error.message) processedError.message = error.message
      if (error.stack && this.isDevelopment) processedError.stack = error.stack

      Object.keys(error)
        .filter(
          (key) =>
            key !== 'stack' &&
            key !== 'name' &&
            key !== 'message' &&
            key !== 'httpCode'
        )
        .forEach((key) => (processedError[key] = (error as any)[key]))

      // if (this.errorOverridingMap)
      //   Object.keys(this.errorOverridingMap)
      //     .filter(key => name === key)
      //     .forEach(key => processedError = this.merge(processedError, this.errorOverridingMap[key]));

      return Object.keys(processedError).length > 0 ? processedError : undefined
    }

    return error
  }

  /**
   * Adapted from BaseDriver
   */
  public processTextError(error: any) {
    if (error instanceof Error) {
      if (this.isDevelopment && error.stack) {
        return error.stack
      } else if (error.message) {
        return error.message
      }
    }
    return error
  }
}
