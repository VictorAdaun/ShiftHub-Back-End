//@ts-ignore
import { defaultMetadataStorage } from 'class-transformer/cjs/storage'

import { IS_OBJECT, IS_DATE_STRING } from 'class-validator'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import * as oa from 'openapi3-ts'
import {
  getMetadataArgsStorage,
  RoutingControllersOptions,
} from 'routing-controllers'
import { routingControllersToSpec } from 'routing-controllers-openapi'
import '../modules/user/types/AuthRequest'
import '../modules/task/types/TaskRequest'
import '../modules/team/types/TeamRequest'
import '../modules/schedule/types/ScheduleRequest'
import '../modules/employee/types/EmployeeRequest'

const schemas = validationMetadatasToSchemas({
  classTransformerMetadataStorage: defaultMetadataStorage,
  refPointerPrefix: '#/components/schemas/',
  additionalConverters: {
    [IS_OBJECT]: { type: 'object' },
    [IS_DATE_STRING]: {
      pattern: '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d.\\d+Z?',
      type: 'string',
    },
  },
})

const storage = getMetadataArgsStorage()
export const swaggerSpec = (
  routingControllersOptions: RoutingControllersOptions
) =>
  routingControllersToSpec(storage, routingControllersOptions, {
    components: {
      schemas: schemas as Record<string, oa.SchemaObject | oa.ReferenceObject>,
      securitySchemes: {
        bearerAuth: {
          name: 'Authorization',
          in: 'header',
          type: 'apiKey',
          description:
            'Enter the token with the `Bearer: ` prefix, e.g. "Bearer 123456".',
        },
      },
    },
    info: {
      description: 'EZScheduler full API',
      title: 'API for EZScheduler',
      version: '1.0.0',
    },
  })
