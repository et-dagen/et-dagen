import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { EventInput } from '@/contracts/event'
import { typedSchemaOf } from '@/lib/forms/zodSchema'

const schema = typedSchemaOf(
  z.object({
    name: z.string({ error: 'required' }).trim().min(1, 'required'),
    location: z.object({ name: z.string().min(1, 'required') }),
    years: z.array(z.number().max(5, 'too_big')),
  }),
)

describe('typedSchemaOf', () => {
  it('gives the parsed value when the form is valid', async () => {
    await expect(
      schema.parse({ name: ' Ada ', location: { name: 'EL5' }, years: [1] }),
    ).resolves.toEqual({
      value: { name: 'Ada', location: { name: 'EL5' }, years: [1] },
      errors: [],
    })
  })

  it('names each field the way vee-validate does, nested and in lists', async () => {
    const { value, errors } = await schema.parse({
      location: { name: '' },
      years: [1, 9],
    } as never)

    expect(value).toBeUndefined()
    expect(errors).toEqual([
      { path: 'name', errors: ['required'] },
      { path: 'location.name', errors: ['required'] },
      { path: 'years[1]', errors: ['too_big'] },
    ])
  })

  it('reports the chosen variant of a union, with the cross-field checks at once', async () => {
    const { errors } = await typedSchemaOf(EventInput).parse({
      signup: true,
      title: 'Kick-off',
      companyUID: 'etdagene',
      description: '<p>Hei</p>',
      location: { name: 'Stripa', map: '' },
      start: '2026-11-04T12:00',
      end: '2026-11-04T11:00',
      capacity: '',
      opens: '2026-11-01T12:00',
      closes: '2026-11-04T12:00',
    } as never)

    expect(errors).toEqual([
      { path: 'capacity', errors: ['number'] },
      { path: 'end', errors: ['end_before_start'] },
    ])
  })
})
