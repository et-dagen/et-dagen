/**
 * The one place that picks an adapter for each port
 *
 * @remarks
 * Handlers import their dependencies from here rather than building them, so a later store (the
 * PostgreSQL move) changes this file and nothing that uses it.
 */
import { firebaseFileStorage } from './adapters/firebase/fileStorage'
import { rtdbBoardRepository } from './adapters/rtdb/boardRepository'
import { rtdbCompanyRepository } from './adapters/rtdb/companyRepository'
import { sharpImageProcessor } from './adapters/sharp/imageProcessor'
import { firebaseUserDirectory } from './adapters/firebase/userDirectory'
import { rtdbEventRepository } from './adapters/rtdb/eventRepository'
import { rtdbFileRepository } from './adapters/rtdb/fileRepository'
import { rtdbStandMapIndex } from './adapters/rtdb/standMapIndex'
import { rtdbUserRepository } from './adapters/rtdb/userRepository'
import { auth, db, storage } from './utils/firebase'

export const events = rtdbEventRepository(db)
export const users = firebaseUserDirectory(auth)
export const profiles = rtdbUserRepository(db)
export const companies = rtdbCompanyRepository(db)
export const files = rtdbFileRepository(db)
export const fileStorage = firebaseFileStorage(storage.bucket())
export const standMaps = rtdbStandMapIndex(db)
export const board = rtdbBoardRepository(db)
export const images = sharpImageProcessor()
