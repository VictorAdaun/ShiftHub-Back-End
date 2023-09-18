// eslint-disable-next-line import/order
import '../bootstrap'
import { InternalApplication } from '../app/InternalApplication'
import { logger } from '../core/logging/logger'

const port = process.env.INTERNAL_APP_PORT || 6002

new InternalApplication().listen(Number(port), () => {
  logger.info(`
        Internal Application  now Running
        URL: http://localhost:${port}
    `)
})
