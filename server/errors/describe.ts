import {
  AppError,
  ERRORS,
  isErrorCode,
  type ErrorDetails,
  type ErrorSpec,
} from '@/domain/errors'

/** The fields of an h3 `H3Error` the error boundary reads */
export interface HttpErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: unknown
  cause?: unknown
  stack?: string
  unhandled?: boolean
}

/** One error in the chain that led to a failure, outermost first */
export interface Cause {
  type: string
  message: string
  /** Provider code, such as Firebase's `auth/email-already-exists` */
  code?: string
}

/** Everything the boundary logs and answers about one failed request */
export interface ErrorReport {
  type: string
  code: string
  status: number
  message: string
  /** What the response's `statusMessage` says; v1 clients parse it */
  statusMessage: string
  retriable: boolean
  details?: ErrorDetails
  causes: Cause[]
  stack?: string
}

const UNEXPECTED = 'internal/unexpected'
const MAX_CAUSES = 5

/** v1 handlers write the code into the status message as `Error (<code>).` */
const LEGACY_CODE = /^Error \(([^)]+)\)\.?$/

/**
 * Classify an error that left a route handler
 *
 * @remarks
 * Three kinds arrive here: an {@link AppError}, whose code names everything; a `createError` from
 * a v1 handler, kept as it is; and anything else, which is a bug or an outage and is reported as
 * `internal/unexpected` without leaking its message to the client.
 */
export function describeError(error: HttpErrorLike): ErrorReport {
  const data = error.data as
    | { code?: unknown; details?: ErrorDetails }
    | undefined
  const code = data?.code
  if (isErrorCode(code)) {
    const spec: ErrorSpec = ERRORS[code]
    const cause =
      error.cause instanceof AppError ? error.cause.cause : error.cause
    return {
      type: 'AppError',
      code,
      status: spec.status,
      message: spec.message,
      statusMessage: `Error (${code}).`,
      retriable: spec.retriable ?? false,
      details: data?.details,
      causes: causeChain(cause),
      stack: error.stack,
    }
  }

  if (error.unhandled || !error.statusCode) {
    const causes = unexpectedCauses(error)
    return {
      type: causes[0]?.type ?? 'Error',
      code: UNEXPECTED,
      status: ERRORS[UNEXPECTED].status,
      message: ERRORS[UNEXPECTED].message,
      statusMessage: `Error (${UNEXPECTED}).`,
      retriable: false,
      causes,
      stack: error.stack,
    }
  }

  const statusMessage = error.statusMessage ?? error.message ?? ''
  return {
    type: 'H3Error',
    code: LEGACY_CODE.exec(statusMessage)?.[1] ?? `http/${error.statusCode}`,
    status: error.statusCode,
    message: statusMessage,
    statusMessage,
    retriable: false,
    causes: causeChain(error.cause),
    stack: error.stack,
  }
}

/**
 * The errors behind an unhandled one
 *
 * @remarks
 * h3 wraps a thrown error and keeps its message but replaces it with its `cause` when it has one,
 * so the thrown error is listed from the wrapper's message unless the chain already starts with it.
 */
function unexpectedCauses(error: HttpErrorLike): Cause[] {
  const chain = causeChain(error.cause)
  if (chain[0]?.message === error.message) return chain
  return [{ type: 'Error', message: error.message ?? '' }, ...chain].slice(
    0,
    MAX_CAUSES,
  )
}

function causeChain(value: unknown): Cause[] {
  const causes: Cause[] = []
  while (value instanceof Error && causes.length < MAX_CAUSES) {
    const code = (value as { code?: unknown }).code
    causes.push({
      type: value.name,
      message: value.message,
      ...(typeof code === 'string' && { code }),
    })
    value = value.cause
  }
  return causes
}
