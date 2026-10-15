import type { Brand } from '@/domain/brand'

/**
 * An address that is plausibly deliverable
 *
 * @remarks
 * The brand promises the value is shaped like an address and can be stored and displayed
 * safely. It does not promise anyone reads mail there — the only real test of an address is
 * sending to it, so treat this as a typo filter rather than proof of existence.
 */
export type EmailAddress = Brand<string, 'EmailAddress'>

/**
 * Deliberately permissive
 *
 * @remarks
 * Strict RFC 5322 patterns are notorious for rejecting valid addresses — quoted local parts,
 * plus-addressing, long or new top-level domains. This checks only what a typo actually breaks:
 * one `@`, something either side of it, no whitespace, and a dot-separated domain.
 */
const PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/**
 * Email addresses
 */
export const EmailAddress = {
  is: (value: unknown): value is EmailAddress =>
    typeof value === 'string' && PATTERN.test(value),

  /**
   * Validate an address and canonicalise its domain to lowercase
   *
   * @remarks
   * Only the domain is lowercased. The local part is case-sensitive per RFC 5321 — almost no
   * provider honours that, but silently rewriting the half of the address a user typed is not
   * this function's decision to make.
   *
   * @throws RangeError when the value is not shaped like an address
   */
  parse: (value: string): EmailAddress => {
    if (!PATTERN.test(value))
      throw new RangeError(`Not an email address: ${value}`)
    const at = value.lastIndexOf('@')
    return `${value.slice(0, at)}@${value.slice(at + 1).toLowerCase()}` as EmailAddress
  },

  /**
   * Parse from untrusted input, such as a sign-up form or a database read
   *
   * @returns The address, or null when it is not shaped like one
   */
  tryParse: (value: string): EmailAddress | null =>
    PATTERN.test(value) ? EmailAddress.parse(value) : null,
} as const

/**
 * Domains where the local part ignores dots, so `p.eglin` and `peglin` are one mailbox
 *
 * @remarks
 * A Google convention rather than a rule of email. Applying it anywhere else would merge two
 * genuinely different people: `p.eglin@stud.ntnu.no` and `peglin@stud.ntnu.no` are separate
 * accounts, and treating them as one would lock the second person out of signing up.
 */
const DOT_INSENSITIVE = new Set(['gmail.com', 'googlemail.com'])

/** Domains that are another name for the same mail system */
const DOMAIN_ALIASES = new Map([['googlemail.com', 'gmail.com']])

/**
 * The mailbox an address ultimately reaches, for recognising one person signing up twice
 *
 * @remarks
 * Branded separately from {@link EmailAddress} so the two cannot be confused, because they are
 * for opposite purposes. Mail must always be sent to the {@link EmailAddress} the user gave —
 * people route `+etd` tags into folders, and delivering to the stripped form quietly breaks
 * that. This value is only ever a lookup key.
 *
 * Store it alongside the address and compare on it when a new account is created.
 */
export type EmailIdentity = Brand<string, 'EmailIdentity'>

/**
 * Reduce an address to the mailbox behind it
 *
 * @remarks
 * Subaddressing — everything from the first `+` to the `@` — is dropped for every domain.
 * RFC 5233 names `+` as the separator and the large providers all honour it, but it is a
 * convention rather than a guarantee: a provider treating `+` as an ordinary character would
 * see two mailboxes where this sees one.
 *
 * That makes this a strong hint, not proof. Prefer surfacing "this looks like an account you
 * already have" over refusing the signup outright, since a wrong merge locks a real person out
 * while a missed duplicate merely leaves two accounts to reconcile.
 *
 * @returns A key that is equal for two addresses reaching the same mailbox
 */
export const identityOf = (email: EmailAddress): EmailIdentity => {
  const at = email.lastIndexOf('@')
  const domain = DOMAIN_ALIASES.get(email.slice(at + 1)) ?? email.slice(at + 1)

  // Unlike the address itself, the local part is lowercased here: no provider in practice
  // distinguishes `Philip` from `philip`, and this value only ever identifies, never delivers.
  let local = email.slice(0, at).toLowerCase()

  const tag = local.indexOf('+')
  // `+etd@example.com` is a legal address whose local part is entirely a tag. Dropping it would
  // leave an empty key that collides with every other such address, so keep the original.
  if (tag > 0) local = local.slice(0, tag)

  if (DOT_INSENSITIVE.has(domain)) local = local.replaceAll('.', '')

  return `${local}@${domain}` as EmailIdentity
}

/**
 * Whether two addresses reach the same mailbox
 */
export const sameAccount = (left: EmailAddress, right: EmailAddress): boolean =>
  identityOf(left) === identityOf(right)
