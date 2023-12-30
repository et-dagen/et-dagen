export interface Event {
  attendants: {
    [key: string]: string // key: string, value: userUID
  }
  capacity: number
  companyUID: string
  date: {
    start: string // ISO 8601 Datetime string. Format: YYYY-MM-DDThh:mm:ssZ
    end: string
  }
  description: string | null
  id?: string | null
  location: {
    name: string
    map: string
  }
  title: string
}
