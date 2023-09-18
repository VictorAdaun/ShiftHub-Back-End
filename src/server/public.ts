// eslint-disable-next-line import/order
import '../bootstrap'
import { PublicApplication } from '../app/PublicApplication'
import { logger } from '../core/logging/logger'

const port = process.env.PUBLIC_APP_PORT || 6001

new PublicApplication().listen(Number(port), () => {
  logger.info(`
        Public Application  now Running
        URL: http://localhost:${port}
    `)
})
