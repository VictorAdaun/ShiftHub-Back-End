import winston, { format } from 'winston'

import { serializeErr, serializeReq, serializeRes } from './serializers'

/**
 * Serialize req, res, err keys for log ingestion
 */
const serializers = format((info, opts: { isDev?: boolean } = {}) => {
  if (opts.isDev) {
    if (info.err) {
      const { name, message } = serializeErr(info.err)
      info.err = { name, message }
    }
    delete info.req
    delete info.res
    return info
  }

  if (info.req) {
    info.req = serializeReq(info.req)
  }
  if (info.res) {
    info.res = serializeRes(info.res)
  }
  if (info.err) {
    info.err = serializeErr(info.err)
  }
  return info
})

/**
 * Pulls the message out if its an object and spreads keys on the root object
 */
const flattenMessage = format((info, opts) => {
  if (typeof info.message === 'object') {
    const { message, ...rest } = info.message as any

    info.message = message || ''
    Object.entries(rest).forEach(([key, value]) => {
      info[key] = value
    })
  }
  return info
})

//this just improves readability of the logs
const capitalizeLevel = format((info, opts) => {
  info.level = info.level.toUpperCase()
  return info
})

const moveLevel = format((info, opts) => {
  const { level } = info
  // @ts-ignore
  delete info['level']
  info.logLevel = level

  return info
})

export const LogFormat = {
  pretty: winston.format.combine(
    flattenMessage(),
    capitalizeLevel(),
    serializers({ isDev: true }),
    winston.format.colorize(),
    winston.format.simple()
  ),
  json: winston.format.combine(
    flattenMessage(),
    capitalizeLevel(),
    moveLevel(),
    serializers({ isDev: false }),
    winston.format.json()
  ),
}
