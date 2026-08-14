import { type User } from '~/models/User'

export interface AttendantMetadata {
  attended: boolean
  registeredAt: number
}

export interface Attendant extends User, AttendantMetadata {}
