type BachelorProgramme = {
  kind: 'bachelor'
  duration: 3
  years: [1, 2, 3]
}

type MasterProgramme = {
  kind: 'master'
  duration: 2
  years: [1, 2]
}

type IntegratedMasterProgramme = {
  kind: 'integratedMaster'
  duration: 5
  years: [1, 2, 3, 4, 5]
}

export type ProgrammeType =
  | BachelorProgramme
  | MasterProgramme
  | IntegratedMasterProgramme

export interface StudyProgramme {
  uid: string
  name: string
  type: ProgrammeType
}
