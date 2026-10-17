import { ERRORS, type ErrorCode } from '@/domain/errors/catalog'

/** Facts about one failure, such as the rule a user did not meet. Sent to the client; never secrets. */
export type ErrorDetails = Readonly<Record<string, unknown>>

/**
 * A failure the platform has a name for
 *
 * @remarks
 * It carries only the code, the details and the cause. The status, message and translations are
 * looked up from the code, so a throw site cannot contradict the log or the response.
 */
export class AppError extends Error {
  override readonly name = 'AppError'

  constructor(
    readonly code: ErrorCode,
    readonly details?: ErrorDetails,
    options?: { cause?: unknown },
  ) {
    super(ERRORS[code].message, options)
  }

  /**
   * The code and details, under the name h3 copies from any thrown error
   *
   * @remarks
   * h3 wraps a thrown error that is not its own and keeps only the wrapped error's `cause`, so the
   * error boundary would otherwise lose the code of an AppError that has a cause.
   */
  get data(): { code: ErrorCode; details?: ErrorDetails } {
    return { code: this.code, details: this.details }
  }
}

/**
 * The error to throw for `code`
 *
 * @example
 * throw fail('internal/unexpected', { cause: error })
 */
export const fail = (
  code: ErrorCode,
  extra: { details?: ErrorDetails; cause?: unknown } = {},
): AppError => new AppError(code, extra.details, { cause: extra.cause })
