/**
 * What the platform knows about one kind of failure
 *
 * @remarks
 * The message is for developers, in US English. It goes to the log and to the response, but
 * users never read it: the client shows the translation keyed by the error code.
 */
export interface ErrorSpec {
  /** HTTP status the API answers with */
  readonly status: number
  readonly message: string
  /** Whether the same request may succeed if sent again later */
  readonly retriable?: boolean
}

/**
 * Every error the API answers with, keyed by its code
 *
 * @remarks
 * Codes are `area/kebab-case` and stable, because clients translate them and logs are searched
 * by them. Add a code here before throwing it; the throw site then names only the code.
 */
export const ERRORS = {
  'internal/unexpected': { status: 500, message: 'Unexpected error' },
  'job/invalid-listing': {
    status: 400,
    message: "A job's listing must be 'text' or 'link'",
  },
} as const satisfies Record<string, ErrorSpec>

export type ErrorCode = keyof typeof ERRORS

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && Object.hasOwn(ERRORS, value)
