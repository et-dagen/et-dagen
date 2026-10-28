import type { Database } from 'firebase-admin/database'
import type { BoardRepository } from '@/application/board/boardRepository'
import {
  BoardMemberId,
  PhoneNumber,
  type BoardMember,
} from '@/domain/board/member'
import { EmailAddress } from '@/domain/email'
import { FileId } from '@/domain/files/file'

/** `board/<id>` as stored */
interface MemberRecord {
  name: string
  title: { nb: string; en: string }
  email: string
  phone: string | null
  photo: string | null
  featured: boolean
  order: number
}

const toRecord = ({ id: _id, ...member }: BoardMember): MemberRecord => member

const toMember = (id: string, record: MemberRecord): BoardMember => ({
  id: BoardMemberId.parse(id),
  name: record.name,
  title: { nb: record.title?.nb ?? '', en: record.title?.en ?? '' },
  email: EmailAddress.parse(record.email),
  phone: record.phone ? PhoneNumber.tryParse(record.phone) : null,
  photo: record.photo ? FileId.parse(record.photo) : null,
  featured: record.featured === true,
  order: record.order ?? 0,
})

/** Board members in the Realtime Database under `board/` */
export function rtdbBoardRepository(db: Database): BoardRepository {
  // a reference per call: building the adapter must not open a connection
  const board = () => db.ref('board')

  return {
    all: async () => {
      const value = ((await board().once('value')).val() ?? {}) as Record<
        string,
        MemberRecord
      >
      return Object.entries(value)
        .map(([id, record]) => toMember(id, record))
        .sort((a, b) => a.order - b.order)
    },
    find: async (id) => {
      const record = (
        await board().child(id).once('value')
      ).val() as MemberRecord | null
      return record ? toMember(id, record) : null
    },
    save: async (members) => {
      if (members.length === 0) return
      await board().update(
        Object.fromEntries(members.map((m) => [m.id, toRecord(m)])),
      )
    },
    remove: async (id) => {
      await board().child(id).remove()
    },
  }
}
