import { describe, expect, it } from 'vitest'
import { passwordProblem } from '@/domain/password'

describe('passwordProblem', () => {
  it('takes 8 characters with 3 letters and 3 digits', () => {
    expect(passwordProblem('abc123de')).toBeNull()
  })

  it('names what is missing', () => {
    expect(passwordProblem('ab12')).toBe('password_length')
    expect(passwordProblem('12345678a')).toBe('password_letters')
    expect(passwordProblem('abcdefg12')).toBe('password_digits')
  })
})
