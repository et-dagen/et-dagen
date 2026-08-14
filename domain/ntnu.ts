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

/**
 * A year a student can be in
 *
 * @remarks
 * Derived from the programme definitions rather than restated, so adding a programme with a
 * different length widens this automatically instead of leaving the two to drift apart.
 */
export type StudyYear = ProgrammeType['years'][number]

export interface StudyProgramme {
  uid: string
  name: string
  type: ProgrammeType
}
