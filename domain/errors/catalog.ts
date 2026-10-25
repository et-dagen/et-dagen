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
  'event/register/forbidden': {
    status: 403,
    message: 'This account type cannot sign up for events',
  },
  'file/unsupported-type': {
    status: 415,
    message: 'This kind of file does not accept that format',
  },
  'file/too-large': {
    status: 413,
    message: 'The file is larger than this kind of file allows',
  },
  'file/empty': { status: 400, message: 'The file is empty' },
  'file/wrong-owner': {
    status: 400,
    message: 'This kind of file belongs to a different kind of owner',
  },
  'standmap/forbidden': {
    status: 403,
    message: 'Only admins manage stand maps',
  },
  'standmap/invalid-day': {
    status: 400,
    message: 'A stand map day must be a date written as YYYY-MM-DD',
  },
  'standmap/missing-file': {
    status: 400,
    message: 'Send the stand map as the multipart part named file',
  },
  'standmap/not-found': { status: 404, message: 'This day has no stand map' },
  'board/forbidden': { status: 403, message: 'Only admins manage the board' },
  'board/not-found': { status: 404, message: 'No board member has this id' },
  'board/invalid-name': {
    status: 400,
    message: 'A board member needs a name of at most 120 characters',
  },
  'board/invalid-title': {
    status: 400,
    message: 'A board member needs a title in Norwegian and English',
  },
  'board/invalid-email': {
    status: 400,
    message: "A board member's email must be an email address",
  },
  'board/invalid-phone': {
    status: 400,
    message:
      "A board member's phone number must be digits, spaces and a leading +",
  },
  'board/invalid-order': {
    status: 400,
    message: 'A place on the board must be a whole number from 0',
  },
  'board/missing-file': {
    status: 400,
    message: 'Send the portrait as the multipart part named file',
  },
  'board/unreadable-image': {
    status: 415,
    message: 'The portrait could not be read as a picture',
  },
  'job/invalid-listing': {
    status: 400,
    message: "A job's listing must be 'text' or 'link'",
  },
  'job/invalid-link': {
    status: 400,
    message: "A job's application link must be an http(s) address",
  },
  'event/invalid-map-link': {
    status: 400,
    message: "An event's map link must be an http(s) address",
  },
  'company/invalid-webpage': {
    status: 400,
    message: "A company's website must be an http(s) address",
  },
} as const satisfies Record<string, ErrorSpec>

export type ErrorCode = keyof typeof ERRORS

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && Object.hasOwn(ERRORS, value)
