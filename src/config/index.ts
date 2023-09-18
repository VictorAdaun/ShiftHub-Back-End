import * as dotenv from 'dotenv'
import path from 'path'

import { config } from './config'
// load .env and .secret files into process.env
dotenv.config()
dotenv.config({
  path: path.resolve(process.cwd(), './.secret'),
})

export default config.load({
  ENV: (process.env.NODE_ENV as string) || 'development',
  IS_DEV: process.env.NODE_ENV !== 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_PROD: process.env.NODE_ENV === 'production',
  JWT_SECRET: (process.env.JWT_SECRET as string) || '',
  LOG_LEVEL: (process.env.LOG_LEVEL as string) || 'info',
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID as string) || '',
  CLOUD_NAME: (process.env.CLOUD_NAME as string) || '',
  CLOUD_API_KEY: (process.env.CLOUD_API_KEY as string) || '',
  CLOUD_API_SECRET: (process.env.CLOUD_API_SECRET as string) || '',
})
