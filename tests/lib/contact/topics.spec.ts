import { describe, expect, it } from 'vitest'
import type { ListedMember } from '@/contracts/board'
import { answerFor, CONTACT_TOPICS } from '@/lib/contact/topics'

const member = (email: string): ListedMember => ({
  id: email,
  name: email,
  title: { nb: 'Rolle', en: 'Role' },
  email,
  phone: null,
  photoUrl: null,
  featured: false,
  order: 0,
})

describe('answerFor', () => {
  it('finds the member holding the topic’s mailbox, whatever the case', () => {
    const board = [member('leder@et-dagen.no'), member('Spons@ET-dagen.no')]
    const sponsorship = CONTACT_TOPICS.find((t) => t.key === 'sponsorship')!

    expect(answerFor(sponsorship, board)?.name).toBe('Spons@ET-dagen.no')
  })

  it('is null when no member holds the mailbox', () => {
    expect(
      answerFor(CONTACT_TOPICS[0], [member('leder@et-dagen.no')]),
    ).toBeNull()
    expect(answerFor(CONTACT_TOPICS[0], null)).toBeNull()
  })
})
