import type { Programme, ProgrammeCode } from '@/domain/fair/programme'

/** The study programmes students choose from */
export interface ProgrammeRepository {
  /** Every programme, open or closed */
  all(): Promise<Programme[]>
  /** null when no programme has this code */
  find(code: ProgrammeCode): Promise<Programme | null>
  /** Add the programme, or replace the one with its code */
  save(programme: Programme): Promise<void>
  /**
   * How many students have the programme
   *
   * @remarks
   * Counts students who stored its code, and those who stored its name before codes.
   */
  students(programme: Programme): Promise<number>
  /** Removing a programme that does not exist is not an error */
  remove(code: ProgrammeCode): Promise<void>
}
