export interface TokenData {
  uid: string
  email: string
  name?: string | null
}

export interface User extends TokenData {
  accessLevel?: string[]
  studyProgram: string
  updated: number
}
