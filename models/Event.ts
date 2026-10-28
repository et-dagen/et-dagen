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
  queue?: {
    [key: string]: string // key: timestamp, value: userUID
  }
  registration?: {
    start: string | null
    end: string | null
    requirements?: {
      programmes: string[] | null
      years: number[] | null
    } | null
    reserved?: {
      programmes: string[] // study programme names
      spots: number // spots held for the programmes above
    } | null
  }
  title: string
}
