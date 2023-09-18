import 'reflect-metadata'
import cors from 'cors'
import deepmerge from 'deepmerge'
import * as express from 'express'
import { Express } from 'express'
import {
  useExpressServer,
  RoutingControllersOptions,
  useContainer,
} from 'routing-controllers'
import { Container } from 'typedi'
import { RequestMiddleware } from '../middlewares/RequestMiddleware'
import { ApiResponseMiddleware } from '../middlewares/ApiResponseMiddleware'
import { ErrorHandlerMiddleware } from '../middlewares/ErrorHandlerMiddleware'
import {
  LoggingEndMiddleware,
  LoggingErrorMiddleware,
  LoggingStartMiddleware,
} from '../middlewares/LoggingMiddleware'

import * as swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '../core/swagger'
import { HealthCheckController } from './controllers/HealthCheckController'
import { AuthController } from '../modules/user/controller/AuthController'
import { TaskController } from '../modules/task/controller/TaskController'
import bodyParser from 'body-parser'
import multer from 'multer'
const upload = multer()

useContainer(Container)

export abstract class BaseApplication {
  private app: Express

  private controllerOptions: RoutingControllersOptions

  constructor() {
    this.controllerOptions = deepmerge(
      this.getDefaultConfig(),
      this.getControllerOptions()
    )

    this.app = express.default()
    this.app.use(upload.any())
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))

    this.setupExpressApp(this.app)
    this.setupCors()
    this.setupApiControllers()
    this.setupSwagger()
  }

  public listen(port: number, cb: () => void): void {
    this.app.listen(port, cb)
  }

  protected setupCors() {
    this.app.use(cors())
  }

  private setupApiControllers() {
    useExpressServer(this.app, this.controllerOptions)
  }

  private setupSwagger(): void {
    const internalSpec = swaggerSpec({
      controllers: [HealthCheckController, AuthController, TaskController],
      routePrefix: '/internal',
    })
    const apiSpec = swaggerSpec({
      controllers: [HealthCheckController, AuthController, TaskController],
      routePrefix: '/api',
    })
    this.app.use(
      '/internal/swagger',
      swaggerUi.serve,
      swaggerUi.setup(internalSpec)
    )
    this.app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(apiSpec))
  }

  protected setupExpressApp(_app: express.Express): void {}

  abstract getControllerOptions(): RoutingControllersOptions

  protected getDefaultConfig(): RoutingControllersOptions {
    return {
      middlewares: [
        LoggingStartMiddleware,
        RequestMiddleware,
        ApiResponseMiddleware,
        ErrorHandlerMiddleware,
        LoggingErrorMiddleware,
        LoggingEndMiddleware,
      ],
      validation: {
        forbidUnknownValues: true,
        validationError: { target: false },
      },
      defaultErrorHandler: false,
      routePrefix: '/api',
    }
  }
}
