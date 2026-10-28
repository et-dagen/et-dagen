// GET /api/v1/image/standmap
// endpoint for fetching stand maps
import { listStandMaps } from '@/application/fair/standMaps'
import { fileStorage, files, standMaps } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Image'],
    summary: 'List stand maps by fair day',
    description:
      'Public. One stand map per fair day, as `{ date, url, name?, legacy? }` sorted by ' +
      'date. Maps uploaded per day in the admin come first; a map stored the old way, as ' +
      '`standmaps/<date>.<ext>` in the bucket, is listed with `legacy: true` for a day ' +
      'that has no new one.',
    security: [],
  },
})

export default defineEventHandler(async (event) => {
  // Mark as low importance - only log when debugging
  setLogImportance(event, 'debug')
  setResourceContext(
    event,
    'image',
    'standmap',
    'list',
    'List stand map images',
  )

  const recorded = (
    await listStandMaps({ files, storage: fileStorage, standMaps })
  ).map(({ day, name, url }) => ({ date: day as string, url, name }))
  const days = new Set(recorded.map((map) => map.date))

  // maps from before the admin upload, named by their date; they go once migrated
  const bucket = storage.bucket()
  const [legacy] = await bucket.getFiles({
    prefix: 'standmaps/',
    delimiter: '/',
  })
  const old = legacy
    .filter((map) => map.name !== 'standmaps/')
    .map((map) => ({
      date: map.name.split('standmaps/')[1]!.split('.')[0]!,
      url: `https://storage.googleapis.com/${bucket.name}/${map.name}`,
      legacy: true,
    }))
    .filter((map) => !days.has(map.date))

  return [...recorded, ...old].sort((a, b) => a.date.localeCompare(b.date))
})
