import type { Brand } from '@/domain/brand'
import { EmailAddress } from '@/domain/email'
import type { FileId } from '@/domain/files/file'
import { UUIDv4 } from '@/domain/uuid'

/** Identifies a board member; random, so removing one never renumbers the others */
export type BoardMemberId = Brand<UUIDv4, 'BoardMemberId'>

export const BoardMemberId = {
  /** @throws RangeError when the value is not a version 4 UUID */
  parse: (value: string): BoardMemberId => UUIDv4.parse(value) as BoardMemberId,
  random: (): BoardMemberId => UUIDv4.random() as BoardMemberId,
}

/**
 * A phone number as people write it: an optional `+`, then digits and spaces
 *
 * @remarks
 * Kept as written, so `+47 412 89 452` reads the way the board member gave it; `tel:` links ignore
 * the spaces.
 */
export type PhoneNumber = Brand<string, 'PhoneNumber'>

const PHONE = /^\+?[0-9][0-9 ]{6,18}[0-9]$/

export const PhoneNumber = {
  tryParse: (value: string): PhoneNumber | null => {
    const trimmed = value.trim().replace(/\s+/g, ' ')
    return PHONE.test(trimmed) ? (trimmed as PhoneNumber) : null
  },
}

/** The role as the contact page shows it, in each language the site has */
export interface BoardTitle {
  nb: string
  en: string
}

/**
 * Someone on the board, as the contact page lists them
 *
 * @remarks
 * The title is free text rather than a fixed list, because the board names its own roles and
 * changes them between years.
 */
export interface BoardMember {
  id: BoardMemberId
  name: string
  title: BoardTitle
  email: EmailAddress
  phone: PhoneNumber | null
  /** The member's portrait, a fair file of kind `portrait` */
  photo: FileId | null
  /** Shown on its own above the board, as the contact for companies; at most one member */
  featured: boolean
  /** Place on the contact page, counting from 0 */
  order: number
}

/** What an admin fills in for a member */
export type BoardMemberInput = Pick<
  BoardMember,
  'name' | 'title' | 'email' | 'phone' | 'featured'
>

export type BoardInputProblem =
  | 'board/invalid-name'
  | 'board/invalid-title'
  | 'board/invalid-email'
  | 'board/invalid-phone'

const MAX_TEXT = 120

const text = (value: unknown) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= MAX_TEXT
    ? value.trim()
    : null

/** A member's details from a request, or the first problem with them */
export function checkedMemberInput(
  raw: unknown,
): BoardMemberInput | { problem: BoardInputProblem } {
  const body = (raw ?? {}) as Record<string, unknown>
  const name = text(body.name)
  if (!name) return { problem: 'board/invalid-name' }

  const title = (body.title ?? {}) as Record<string, unknown>
  const nb = text(title.nb)
  const en = text(title.en)
  if (!nb || !en) return { problem: 'board/invalid-title' }

  const email =
    typeof body.email === 'string'
      ? EmailAddress.tryParse(body.email.trim())
      : null
  if (!email) return { problem: 'board/invalid-email' }

  let phone: PhoneNumber | null = null
  if (typeof body.phone === 'string' && body.phone.trim() !== '') {
    phone = PhoneNumber.tryParse(body.phone)
    if (!phone) return { problem: 'board/invalid-phone' }
  } else if (body.phone != null && body.phone !== '') {
    return { problem: 'board/invalid-phone' }
  }

  return {
    name,
    title: { nb, en },
    email,
    phone,
    featured: body.featured === true,
  }
}

/**
 * How portraits are taken in and stored
 *
 * @remarks
 * Any common picture up to 10 MB is accepted; it is cropped and scaled to 800 × 960 (5:6, the
 * contact page's frame) and stored as WebP, so every portrait on the page has the same size.
 */
export const PORTRAIT = {
  width: 800,
  height: 960,
  types: ['image/png', 'image/jpeg', 'image/webp'],
  maxBytes: 10 * 1024 * 1024,
} as const
