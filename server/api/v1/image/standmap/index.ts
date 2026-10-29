// GET /api/v1/image/standmap
// endpoint for fetching stand maps
import { listStandMaps } from '@/application/fair/standMaps'
import { fileStorage, files, standMaps } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Image'],
    summary: 'List stand maps by fair day',
    description:
      'Public. One stand map per fair day, as `{ date, url, name }` sorted by date.',
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

  return (await listStandMaps({ files, storage: fileStorage, standMaps })).map(
    ({ day, name, url }) => ({ date: day as string, url, name }),
  )
})
