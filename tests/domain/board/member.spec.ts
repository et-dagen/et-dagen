import { describe, expect, it } from 'vitest'
import { checkedMemberInput, PhoneNumber } from '@/domain/board/member'

const valid = {
  name: ' Kari Nordmann ',
  title: { nb: 'Leder', en: 'Manager' },
  email: 'leder@ET-dagen.no',
  phone: '+47  412 89 452',
  featured: true,
}

describe('checkedMemberInput', () => {
  it('trims the text, lowercases the email domain and keeps the phone as written', () => {
    expect(checkedMemberInput(valid)).toEqual({
      name: 'Kari Nordmann',
      title: { nb: 'Leder', en: 'Manager' },
      email: 'leder@et-dagen.no',
      phone: '+47 412 89 452',
      featured: true,
    })
  })

  it('takes no phone, and featured only when it is true', () => {
    expect(
      checkedMemberInput({ ...valid, phone: '', featured: 'yes' }),
    ).toMatchObject({ phone: null, featured: false })
    expect(checkedMemberInput({ ...valid, phone: undefined })).toMatchObject({
      phone: null,
    })
  })

  it('names the first problem', () => {
    expect(checkedMemberInput({ ...valid, name: '  ' })).toEqual({
      problem: 'board/invalid-name',
    })
    expect(checkedMemberInput({ ...valid, title: { nb: 'Leder' } })).toEqual({
      problem: 'board/invalid-title',
    })
    expect(checkedMemberInput({ ...valid, email: 'leder' })).toEqual({
      problem: 'board/invalid-email',
    })
    expect(checkedMemberInput({ ...valid, phone: 'ring meg' })).toEqual({
      problem: 'board/invalid-phone',
    })
    expect(checkedMemberInput({ ...valid, phone: 4741289452 })).toEqual({
      problem: 'board/invalid-phone',
    })
    expect(checkedMemberInput(null)).toEqual({ problem: 'board/invalid-name' })
  })
})

describe('PhoneNumber', () => {
  it('takes digits and spaces with an optional leading +', () => {
    expect(PhoneNumber.tryParse('41289452')).toBe('41289452')
    expect(PhoneNumber.tryParse('+47 412 89 452')).toBe('+47 412 89 452')
    expect(PhoneNumber.tryParse('412-89-452')).toBeNull()
    expect(PhoneNumber.tryParse('123')).toBeNull()
  })
})
