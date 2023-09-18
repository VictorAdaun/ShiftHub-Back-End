import { ApiErrorResponse } from '../types'

export type ErrorData = { [k: string]: any }

export class InvariantError extends Error {
  data?: ErrorData
  constructor(message: string, data?: ErrorData) {
    super()
    this.message = `Invariant: ${message}`
    this.data = data
  }
}

export class ApiError extends Error {
  data?: ErrorData
  httpCode: number
  message: string = 'An error occurred'

  constructor(httpCode: number, message: string, data?: ErrorData) {
    super()

    this.message = message
    this.httpCode = httpCode
    this.data = data
  }

  public toJSON(): ApiErrorResponse {
    const json: Partial<ApiErrorResponse> = {
      isError: true,
      name: this.constructor.name,
      message: this.message,
    }

    if (this.data) {
      json.data = this.data
    }

    json.stack = this.stack

    return json as ApiErrorResponse
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, data?: ErrorData) {
    super(400, message, data)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, data?: ErrorData) {
    super(401, message, data)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, data?: ErrorData) {
    super(403, message, data)
  }
}

export class NotFoundError extends ApiError {
  constructor(message?: string, data?: ErrorData) {
    super(404, message || 'The resource could not be found', data)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, data?: ErrorData) {
    super(409, message, data)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string, data?: ErrorData) {
    super(500, message, data)
  }
}
