import type { StandMapIndex } from '@/application/fair/standMapIndex'
import {
  removeFile,
  uploadFile,
  type FileDependencies,
} from '@/application/files/uploadFile'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { fail } from '@/domain/errors'
import type { FairDay } from '@/domain/fair/day'
import { storagePathOf, type StoredFile } from '@/domain/files/file'
import type { ISO8601String } from '@/domain/time'

export interface StandMapDependencies extends FileDependencies {
  standMaps: StandMapIndex
}

/** A fair day's stand map as the programme and the admin show it */
export interface StandMap {
  day: FairDay
  /** The name it was uploaded with */
  name: string
  url: string
}

const shown = (
  day: FairDay,
  file: StoredFile,
  { storage }: Pick<StandMapDependencies, 'storage'>,
): StandMap => ({
  day,
  name: file.name,
  url: storage.publicUrl(storagePathOf(file)),
})

/** Every fair day's stand map, by day */
export async function listStandMaps(
  deps: Pick<StandMapDependencies, 'files' | 'storage' | 'standMaps'>,
): Promise<StandMap[]> {
  const days = [...(await deps.standMaps.all())].sort(([a], [b]) =>
    a.localeCompare(b),
  )
  const maps = await Promise.all(
    days.map(async ([day, id]) => {
      const file = await deps.files.find(id)
      return file && shown(day, file, deps)
    }),
  )
  return maps.filter((map) => map !== null)
}

/**
 * Store a day's stand map, replacing the one it had
 *
 * @remarks
 * The old map is removed only after the day points at the new one, so a failed upload leaves the
 * day with the map it had.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, or the `file/*` codes of {@link uploadFile}
 */
export async function putStandMap(
  deps: StandMapDependencies,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    day: FairDay
    name: string
    contentType: string
    bytes: Uint8Array
  },
): Promise<StandMap> {
  authorize(request.subject, 'image', 'upload', undefined, { now: request.now })

  const previous = (await deps.standMaps.all()).get(request.day)
  const file = await uploadFile(
    {
      kind: 'standmap',
      owner: { kind: 'fair' },
      uploader: request.subject.uid,
      name: request.name,
      contentType: request.contentType,
      bytes: request.bytes,
    },
    deps,
  )
  await deps.standMaps.set(request.day, file.id)
  const old = previous && (await deps.files.find(previous))
  if (old) await removeFile(old, deps)
  return shown(request.day, file, deps)
}

/**
 * Remove a day's stand map
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `standmap/not-found`
 */
export async function removeStandMap(
  deps: Pick<StandMapDependencies, 'files' | 'storage' | 'standMaps'>,
  request: { subject: Subject | undefined; now: ISO8601String; day: FairDay },
): Promise<void> {
  authorize(request.subject, 'image', 'upload', undefined, { now: request.now })

  const id = (await deps.standMaps.all()).get(request.day)
  if (!id) throw fail('standmap/not-found')
  await deps.standMaps.remove(request.day)
  const file = await deps.files.find(id)
  if (file) await removeFile(file, deps)
}
