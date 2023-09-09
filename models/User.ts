export interface TokenData {
  uid: string
  email: string
  name?: string | null
}

export interface User extends TokenData {
  userType: string
  studyProgram: string
  updated: number
}
