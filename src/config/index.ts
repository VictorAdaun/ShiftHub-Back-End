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
  GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET as string) || '',
  CLOUD_NAME: (process.env.CLOUD_NAME as string) || '',
  CLOUD_API_KEY: (process.env.CLOUD_API_KEY as string) || '',
  CLOUD_API_SECRET: (process.env.CLOUD_API_SECRET as string) || '',
  NODEMAILER_USER: (process.env.NODEMAILER_USER as string) || '',
  NODEMAILER_PASS: (process.env.NODEMAILER_PASS as string) || '',
  NODEMAILER_ACCOUNT: (process.env.NODEMAILER_ACCOUNT as string) || '',
  REFRESH_TOKEN: (process.env.REFRESH_TOKEN as string) || '',
  REDIRECT_URI: (process.env.REDIRECT_URi as string) || '',
})
