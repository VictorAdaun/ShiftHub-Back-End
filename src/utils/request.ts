import { Response } from 'express'

/**
 * Resolves after the response's headers are sent or rejects if the maximum
 * attempts are reached.
 *
 * If awaited inside a middleware it's **very** important to call this **after**
 * calling `next()` otherwise the response will not be sent before this times
 * out.
 *
 * @returns Promise<number> The number of miliseconds we waited.
 */
export function waitForResponse(
  res: Response,
  maxAttempts: number = 5
): Promise<number> {
  const start = Date.now()

  function test(
    attempt: number,
    resolve: (r: number) => void,
    reject: (r: number) => void
  ) {
    const headersSent = res.headersSent

    // If the response has not been sent, try to wait until it is.
    if (!headersSent && attempt < maxAttempts) {
      const delay = attempt * 10 * attempt ** 2

      setTimeout(() => test(attempt + 1, resolve, reject), delay)
      return
    }
    const delta = Date.now() - start
    headersSent ? resolve(delta) : reject(delta)
  }

  return new Promise((resolve, reject) => test(0, resolve, reject))
}
