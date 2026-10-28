import { z } from 'zod'

const required = z.string({ error: 'required' }).trim().min(1, 'required')

/**
 * A board member as the admin form holds it, without the portrait, which is uploaded on its own
 *
 * @remarks
 * Messages are keys under `form.errors`. The server checks the same rules again with
 * `checkedMemberInput`; {@link toMemberBody} gives it the shape it reads.
 */
export const BoardMemberForm = z.object({
  name: required.max(120, 'too_long'),
  titleNb: required.max(120, 'too_long'),
  titleEn: required.max(120, 'too_long'),
  email: required.refine(
    (value) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value),
    'email',
  ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\+?[0-9][0-9 ]{6,18}[0-9]$/.test(value),
      'phone',
    )
    .default(''),
  featured: z.boolean().default(false),
})

export type BoardMemberForm = z.infer<typeof BoardMemberForm>

/** The body the board endpoints take */
export const toMemberBody = (form: BoardMemberForm) => ({
  name: form.name,
  title: { nb: form.titleNb, en: form.titleEn },
  email: form.email,
  phone: form.phone,
  featured: form.featured,
})

/** A member as `GET /api/v1/board` lists them */
export interface ListedMember {
  id: string
  name: string
  title: { nb: string; en: string }
  email: string
  phone: string | null
  photoUrl: string | null
  featured: boolean
  order: number
}
