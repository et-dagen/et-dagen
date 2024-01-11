export interface Job {
  companyUID: string
  deadline: string // ISO 8601 Datetime string. Format: YYYY-MM-DDThh:mm:ssZ
  description: string
  jobType: 'full-time' | 'graduate' | 'summer-internship'
  location: string
  title: string
  uid?: string | null
}
