import type { ISO8601String } from '@/domain/time'
import type { StudentUser } from '@/domain/user'

export interface AttendantMetadata {
  attended: boolean
  registeredAt: ISO8601String
}

export interface Attendant extends StudentUser, AttendantMetadata {}
