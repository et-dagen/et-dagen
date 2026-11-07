import type { Programme, ProgrammeId } from '@/domain/fair/programme'

/** The study programmes students choose from */
export interface ProgrammeRepository {
  /** Every programme, open or closed */
  all(): Promise<Programme[]>
  /** null when no programme has this id */
  find(id: ProgrammeId): Promise<Programme | null>
  /** Add the programme, or replace the one with its id */
  save(programme: Programme): Promise<void>
  /**
   * Save the programme under its new name and move every student on the old name to it, at once
   *
   * @returns how many students moved
   */
  rename(programme: Programme, from: string): Promise<number>
  /** How many students have the programme, by name */
  students(name: string): Promise<number>
  /** Removing a programme that does not exist is not an error */
  remove(id: ProgrammeId): Promise<void>
}
