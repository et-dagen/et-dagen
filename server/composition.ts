/**
 * The one place that picks an adapter for each port
 *
 * @remarks
 * Handlers import their dependencies from here rather than building them, so a later store (the
 * PostgreSQL move) changes this file and nothing that uses it.
 */
import { useRuntimeConfig } from 'nitropack/runtime'
import { firebaseFileStorage } from './adapters/firebase/fileStorage'
import { rtdbActivityLog } from './adapters/rtdb/activityLog'
import { firebaseNewAccounts } from './adapters/firebase/newAccounts'
import { rtdbAccessRepository } from './adapters/rtdb/accessRepository'
import { rtdbAffiliationRepository } from './adapters/rtdb/affiliationRepository'
import { rtdbBoardRepository } from './adapters/rtdb/boardRepository'
import { rtdbCompanyRepository } from './adapters/rtdb/companyRepository'
import { sharpImageProcessor } from './adapters/sharp/imageProcessor'
import { firebaseUserDirectory } from './adapters/firebase/userDirectory'
import { rtdbEventRepository } from './adapters/rtdb/eventRepository'
import { rtdbFairInfoRepository } from './adapters/rtdb/fairInfoRepository'
import { rtdbFileRepository } from './adapters/rtdb/fileRepository'
import { rtdbInvitationRepository } from './adapters/rtdb/invitationRepository'
import { rtdbJobRepository } from './adapters/rtdb/jobRepository'
import { rtdbProgrammeRepository } from './adapters/rtdb/programmeRepository'
import { rtdbResumeIndex } from './adapters/rtdb/resumeIndex'
import { rtdbStandMapIndex } from './adapters/rtdb/standMapIndex'
import { rtdbUserRepository } from './adapters/rtdb/userRepository'
import { mailerFor } from './mail/mailerFor'
import { auth, db, storage } from './utils/firebase'

export const events = rtdbEventRepository(db)
export const users = firebaseUserDirectory(auth)
export const profiles = rtdbUserRepository(db)
export const access = rtdbAccessRepository(db)
export const companies = rtdbCompanyRepository(db)
export const affiliations = rtdbAffiliationRepository(db)
export const files = rtdbFileRepository(db)
export const fileStorage = firebaseFileStorage(storage.bucket())
export const standMaps = rtdbStandMapIndex(db)
export const resumes = rtdbResumeIndex(db)
export const board = rtdbBoardRepository(db)
export const invitations = rtdbInvitationRepository(db)
export const jobs = rtdbJobRepository(db)
export const programmes = rtdbProgrammeRepository(db)
export const fair = rtdbFairInfoRepository(db)
export const newAccounts = firebaseNewAccounts(auth, db)
export const images = sharpImageProcessor()
export const activity = rtdbActivityLog(db)

export const mailer = mailerFor(
  useRuntimeConfig(),
  process.env.NODE_ENV === 'production',
)
