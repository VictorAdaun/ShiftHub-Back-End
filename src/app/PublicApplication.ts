import express from 'express'
import 'reflect-metadata'

import { RoutingControllersOptions } from 'routing-controllers'

import { BaseApplication } from './BaseApplication'
import { HealthCheckController } from './controllers/HealthCheckController'
import config from '../config'
import { AuthController } from '../modules/user/controller/AuthController'
import { TaskController } from '../modules/task/controller/TaskController'
import { TeamController } from '../modules/team/controller/TeamController'
import { ScheduleController } from '../modules/schedule/controller/ScheduleController'

if (config('IS_PROD')) {
  // logger.info({ action: 'init jobs' }, 'init jobs')
  // initJobs()
}

export class PublicApplication extends BaseApplication {
  getControllerOptions(): RoutingControllersOptions {
    return {
      controllers: [
        HealthCheckController,
        AuthController,
        TaskController,
        TeamController,
        ScheduleController,
      ],
      routePrefix: '/api',
    }
  }

  protected setupExpressApp(app: express.Express): void {
    // Trust proxy-set headers (e.g. X-Forwarded-For) if the requesting IP is
    // a local address. This allows us to get the actuall client's IP address
    // from the request instead of the proxy's IP.
    // @see https://expressjs.com/en/guide/behind-proxies.html
    app.set('trust proxy', 'uniquelocal')
  }
}
