import express from 'express'
import 'reflect-metadata'

import { RoutingControllersOptions } from 'routing-controllers'

import { BaseApplication } from './BaseApplication'
import { HealthCheckController } from './controllers/HealthCheckController'
import { AuthController } from '../modules/user/controller/AuthController'
import { TaskController } from '../modules/task/controller/TaskController'
import { TeamController } from '../modules/team/controller/TeamController'
import { ScheduleController } from '../modules/schedule/controller/ScheduleController'
import { EmployeeController } from '../modules/teammate/controller/TaskController'
export class PublicApplication extends BaseApplication {
  getControllerOptions(): RoutingControllersOptions {
    const used = process.memoryUsage()

    console.log('Memory Usage:')
    console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`)
    console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`)
    console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`)
    return {
      controllers: [
        HealthCheckController,
        AuthController,
        TaskController,
        TeamController,
        ScheduleController,
        EmployeeController,
      ],
      routePrefix: '/api',
    }
  }

  protected setupExpressApp(app: express.Express): void {
    app.set('trust proxy', 'uniquelocal')
  }
}
