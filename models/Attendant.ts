import { type User } from '~/models/User'

export interface AttendantMetadata {
  attended: boolean
  registeredAt: number
  reserved?: boolean // registered as part of the event's reserved programmes
}

export interface Attendant extends User, AttendantMetadata {}
