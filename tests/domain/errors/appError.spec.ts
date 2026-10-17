import { describe, expect, it } from 'vitest'
import { AppError, ERRORS, fail, isErrorCode } from '@/domain/errors'

describe('fail', () => {
  it('takes the message from the catalogue', () => {
    const error = fail('internal/unexpected')

    expect(error).toBeInstanceOf(AppError)
    expect(error.message).toBe(ERRORS['internal/unexpected'].message)
  })

  it('keeps the cause and details', () => {
    const cause = new Error('socket hang up')
    const error = fail('internal/unexpected', {
      cause,
      details: { attempt: 2 },
    })

    expect(error.cause).toBe(cause)
    expect(error.data).toEqual({
      code: 'internal/unexpected',
      details: { attempt: 2 },
    })
  })
})

describe('isErrorCode', () => {
  it('accepts catalogued codes only', () => {
    expect(isErrorCode('internal/unexpected')).toBe(true)
    expect(isErrorCode('toString')).toBe(false)
    expect(isErrorCode(undefined)).toBe(false)
  })
})

describe('the catalogue', () => {
  it('names codes as area/kebab-case', () => {
    for (const code of Object.keys(ERRORS)) {
      expect(code).toMatch(/^[a-z]+(-[a-z]+)*(\/[a-z]+(-[a-z]+)*)+$/)
    }
  })
})
