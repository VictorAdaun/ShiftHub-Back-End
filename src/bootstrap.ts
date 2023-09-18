/* eslint-disable import/order */
/**
 * This file should get imported first in any entry point in the app
 *
 * Responsible for:
 * - loading env config
 * - setting up the logger
 */
import * as dotenv from 'dotenv' // eslint-disable-line
import path from 'path' // eslint-disable-line
import config from './config'
import { LogFormat } from './core/logging/formatters'
import { logger } from './core/logging/logger'

dotenv.config()
// load secrets sssshhhhhh
dotenv.config({
  path: path.resolve(process.cwd(), './.secret'),
})

const env = config('ENV')

logger.configure({
  level: config('LOG_LEVEL'),
  format:
    env === 'staging' || env === 'production'
      ? LogFormat.json
      : LogFormat.pretty,
})
