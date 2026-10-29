/** Why a password is refused, in the words the forms translate */
export type PasswordProblem =
  | 'password_length'
  | 'password_letters'
  | 'password_digits'

const count = (value: string, pattern: RegExp) =>
  (value.match(pattern) ?? []).length

/**
 * The site's password rule: at least 8 characters, 3 of them letters and 3 digits
 *
 * @returns null when the password is accepted
 */
export function passwordProblem(value: string): PasswordProblem | null {
  if (value.length < 8) return 'password_length'
  if (count(value, /[a-zA-Z]/g) < 3) return 'password_letters'
  if (count(value, /\d/g) < 3) return 'password_digits'
  return null
}
