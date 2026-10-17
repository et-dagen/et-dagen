import { createError, isError } from 'h3'
import { describe, expect, it } from 'vitest'
import { fail } from '@/domain/errors'
import { describeError } from '@/server/errors/describe'

/** What h3 hands the error handler when a route handler throws `thrown` */
function caught(thrown: unknown) {
  const error = createError(thrown as Error)
  if (!isError(thrown)) error.unhandled = true
  return error
}

describe('describeError', () => {
  it('looks an AppError up in the catalogue', () => {
    const report = describeError(
      caught(fail('internal/unexpected', { details: { attempt: 2 } })),
    )

    expect(report).toMatchObject({
      type: 'AppError',
      code: 'internal/unexpected',
      status: 500,
      message: 'Unexpected error',
      statusMessage: 'Error (internal/unexpected).',
      details: { attempt: 2 },
      causes: [],
    })
  })

  it('keeps the code of an AppError that has a cause', () => {
    const cause = Object.assign(new Error('Quota exceeded'), {
      code: 'storage/quota-exceeded',
    })
    const report = describeError(caught(fail('internal/unexpected', { cause })))

    expect(report.code).toBe('internal/unexpected')
    expect(report.causes).toEqual([
      {
        type: 'Error',
        message: 'Quota exceeded',
        code: 'storage/quota-exceeded',
      },
    ])
  })

  it('reads the code a v1 handler put in the status message', () => {
    const report = describeError(
      caught(
        createError({
          statusCode: 404,
          statusMessage: 'Error (event/not-found).',
        }),
      ),
    )

    expect(report).toMatchObject({
      type: 'H3Error',
      code: 'event/not-found',
      status: 404,
      statusMessage: 'Error (event/not-found).',
    })
  })

  it('keeps a v1 status message that has no code', () => {
    const report = describeError(
      caught(createError({ statusCode: 400, statusMessage: 'Bad file' })),
    )

    expect(report).toMatchObject({
      code: 'http/400',
      status: 400,
      statusMessage: 'Bad file',
    })
  })

  it('reports anything else as unexpected, with what was thrown as the cause', () => {
    const report = describeError(caught(new TypeError("reading 'data'")))

    expect(report).toMatchObject({
      type: 'TypeError',
      code: 'internal/unexpected',
      status: 500,
      message: 'Unexpected error',
      statusMessage: 'Error (internal/unexpected).',
    })
    expect(report.causes).toEqual([
      { type: 'TypeError', message: "reading 'data'" },
    ])
    expect(report.stack).toContain("TypeError: reading 'data'")
  })

  it('lists the thrown error when h3 kept only its cause', () => {
    const thrown = new Error('Write failed', {
      cause: new Error('PERMISSION_DENIED'),
    })
    const report = describeError(caught(thrown))

    expect(report.causes.map((cause) => cause.message)).toEqual([
      'Write failed',
      'PERMISSION_DENIED',
    ])
  })
})
