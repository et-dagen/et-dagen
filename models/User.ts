export interface TokenData {
  uid: string
  email: string
  name?: string | null
}

export interface User extends TokenData {
  currentYear?: string
  studyProgram?: string
  updated: number
  dietaryRestrictions?: any
  resume: string
}
