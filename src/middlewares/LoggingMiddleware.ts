import { Request, Response, NextFunction } from 'express'
import {
  ExpressMiddlewareInterface,
  Middleware,
  ExpressErrorMiddlewareInterface,
} from 'routing-controllers'
import { Service } from 'typedi'

import { logger } from '../core/logging/logger'
import { waitForResponse } from '../utils/request'

export type TimedRequest = Request & {
  startTime: number
  executionTime: number
}

// middleware should be run very last
@Middleware({ type: 'after', priority: 0 })
@Service()
export class LoggingEndMiddleware implements ExpressMiddlewareInterface {
  use(req: TimedRequest, res: Response, next: NextFunction): void {
    if (res.headersSent) {
      // headers have been sent, this happens for all normal routing controllers requests
      this.logRequest(req, res)
    } else {
      waitForResponse(res).then(() => {
        this.logRequest(req, res)
      })
    }

    next()
  }

  logRequest(req: TimedRequest, res: Response): void {
    const executionTime = Date.now() - req.startTime
    req.executionTime = executionTime

    logger.debug(
      `Request served in ${executionTime}ms ${req.method.toUpperCase()} ${
        req.path
      }`,
      {
        executionTime,
        req,
        res,
      }
    )
  }
}

// this should run first of all middleware
@Middleware({ type: 'before', priority: 100 })
@Service()
export class LoggingStartMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    ;(req as TimedRequest).startTime = Date.now()
    next()
  }
}

@Middleware({ type: 'after', priority: -100 })
@Service()
export class LoggingErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(err: any, req: TimedRequest, res: Response, next: NextFunction): any {
    const executionTime = Date.now() - req.startTime
    req.executionTime = executionTime

    if (!err.shouldReport) {
      logger.info(
        { err, req, res },
        `Request unsuccessful ${req.method.toUpperCase()} ${
          req.path
        } in ${executionTime}ms`
      )
    } else {
      logger.error(
        { err, req, res },
        `An error occurred in ${req.method.toUpperCase()} ${
          req.path
        } in ${executionTime}ms`
      )
    }

    next(err)
  }
}
