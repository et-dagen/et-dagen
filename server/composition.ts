/**
 * The one place that picks an adapter for each port
 *
 * @remarks
 * Handlers import their dependencies from here rather than building them, so a later store (the
 * PostgreSQL move) changes this file and nothing that uses it.
 */
import { firebaseUserDirectory } from './adapters/firebase/userDirectory'
import { rtdbEventRepository } from './adapters/rtdb/eventRepository'
import { auth, db } from './utils/firebase'

export const events = rtdbEventRepository(db)
export const users = firebaseUserDirectory(auth)
