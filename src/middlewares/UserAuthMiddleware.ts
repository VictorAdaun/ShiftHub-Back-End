import { Request, Response, NextFunction } from 'express'
import { ExpressMiddlewareInterface } from 'routing-controllers'
import Container, { Inject, Service } from 'typedi'

import { UnauthorizedError } from '../core/errors/errors'
import { logger } from '../core/logging/logger'
import { AuthService } from '../modules/user/services/AuthService'
// import { AuthRepository } from "../modules/account/repositories/AuthRepository";

const AUTH_TOKEN = 'Authorization'

export type UserRequest = Request & { userId: string; companyId: string }

@Service()
export class UserAuthMiddleware implements ExpressMiddlewareInterface {
  // interface implementation is optional
  @Inject()
  private authService: AuthService

  async use(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authorization = req.header(AUTH_TOKEN)

    try {
      if (!authorization) {
        throw new UnauthorizedError('No authorization provided')
      }

      if (!authorization.startsWith('Bearer')) {
        throw new UnauthorizedError('Invalid auth token')
      }

      const split = authorization.split('Bearer ')
      if (split.length !== 2) {
        throw new UnauthorizedError('Invalid auth token')
      }

      const token = split[1]
      const userId = await this.authService.verifyToken(token)
      req.userId = userId.id
      req.companyId = userId.companyId

      next()
    } catch (error) {
      logger.error('an error occurred', { error })
      next(error)
    }
  }
}
