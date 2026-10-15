import type { Location } from '@/domain/event/location'
import type { ISO8601String } from '@/domain/time'

export type JobType = 'fullTime' | 'graduate' | 'internship'

export interface Job {
  uid: string
  companyUid: string
  deadline?: ISO8601String
  description: string
  location: Location
  title: string
  type: JobType
}
