import { describe, expect, it } from 'vitest'
import { EmailAddress, identityOf, sameAccount } from '~/domain/email'

describe('validation', () => {
  it('accepts the shapes real addresses take', () => {
    expect(EmailAddress.is('philip@eglin.no')).toBe(true)
    expect(EmailAddress.is('philip+claude@eglin.no')).toBe(true)
    expect(EmailAddress.is('p.eglin@stud.ntnu.no')).toBe(true)
    expect(EmailAddress.is("o'brien@example.co.uk")).toBe(true)
  })

  it('rejects what a typo actually breaks', () => {
    expect(EmailAddress.is('philip.eglin.no')).toBe(false) // no @
    expect(EmailAddress.is('philip@')).toBe(false)
    expect(EmailAddress.is('@eglin.no')).toBe(false)
    expect(EmailAddress.is('philip@eglin')).toBe(false) // no dot in domain
    expect(EmailAddress.is('philip@@eglin.no')).toBe(false)
    expect(EmailAddress.is('phil ip@eglin.no')).toBe(false)
    expect(EmailAddress.is('philip@eglin..no')).toBe(false)
    expect(EmailAddress.is('')).toBe(false)
    expect(EmailAddress.is(42)).toBe(false)
  })
})

describe('canonicalisation', () => {
  it('lowercases the domain, which is case-insensitive', () => {
    expect(EmailAddress.parse('philip@EGLIN.NO')).toBe('philip@eglin.no')
  })

  it('preserves the local part, which is not ours to rewrite', () => {
    expect(EmailAddress.parse('Philip.Eglin@eglin.no')).toBe(
      'Philip.Eglin@eglin.no',
    )
  })

  it('leaves plus-addressing intact', () => {
    expect(EmailAddress.parse('philip+claude@EGLIN.no')).toBe(
      'philip+claude@eglin.no',
    )
  })
})

describe('parse and tryParse', () => {
  it('throws on parse and returns null on tryParse', () => {
    expect(() => EmailAddress.parse('nonsense')).toThrow(RangeError)
    expect(EmailAddress.tryParse('nonsense')).toBeNull()
    expect(EmailAddress.tryParse('philip@EGLIN.no')).toBe('philip@eglin.no')
  })
})

describe('the brand', () => {
  it('cannot be satisfied by a bare string', () => {
    // @ts-expect-error an unvalidated literal is not an EmailAddress
    const bad: EmailAddress = 'philip@eglin.no'
    expect(typeof bad).toBe('string')
  })
})

const address = (value: string) => EmailAddress.parse(value)

describe('recognising one person signing up twice', () => {
  it('sees through different plus-addresses on the same mailbox', () => {
    expect(
      sameAccount(
        address('philip+claude@eglin.no'),
        address('philip+etd@eglin.no'),
      ),
    ).toBe(true)
    expect(
      sameAccount(address('philip@eglin.no'), address('philip+etd@eglin.no')),
    ).toBe(true)
  })

  it('ignores case in the local part, which no provider distinguishes', () => {
    expect(
      sameAccount(address('Philip@eglin.no'), address('philip@eglin.no')),
    ).toBe(true)
  })

  it('still tells genuinely different people apart', () => {
    expect(
      sameAccount(address('philip@eglin.no'), address('ingrid@eglin.no')),
    ).toBe(false)
    expect(
      sameAccount(address('philip@eglin.no'), address('philip@ntnu.no')),
    ).toBe(false)
  })
})

describe('provider-specific mailbox rules', () => {
  it('ignores dots in a Gmail local part', () => {
    expect(
      sameAccount(address('p.eglin@gmail.com'), address('peglin@gmail.com')),
    ).toBe(true)
    expect(
      sameAccount(
        address('p.e.glin+etd@googlemail.com'),
        address('peglin@gmail.com'),
      ),
    ).toBe(true)
  })

  it('does not apply the dot rule elsewhere, where it would merge two real people', () => {
    expect(
      sameAccount(
        address('p.eglin@stud.ntnu.no'),
        address('peglin@stud.ntnu.no'),
      ),
    ).toBe(false)
  })
})

describe('identityOf', () => {
  it('is a lookup key, not something to send mail to', () => {
    const typed = address('philip+etd@eglin.no')

    expect(identityOf(typed)).toBe('philip@eglin.no')
    // The address the user gave is untouched, so their filters keep working.
    expect(typed).toBe('philip+etd@eglin.no')
  })

  it('keeps a local part that is entirely a tag, rather than collapsing to nothing', () => {
    // '+etd@example.com' is legal; stripping it would leave a key every such address shares.
    expect(identityOf(address('+etd@example.com'))).toBe('+etd@example.com')
  })

  it('cannot be passed where an address is wanted', () => {
    const key = identityOf(address('philip+etd@eglin.no'))
    // @ts-expect-error an identity key is not a deliverable address
    const wrong: EmailAddress = key
    expect(typeof wrong).toBe('string')
  })
})
