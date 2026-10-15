// GET /api/v1/image/standmap
// endpoint for fetching stand maps from storage

defineRouteMeta({
  openAPI: {
    tags: ['Image'],
    summary: 'List stand map images',
    description:
      'Public. Returns stand map image URLs from the storage bucket, sorted by filename.',
    security: [],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Sorted list of stand map image URLs' },
    // },
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
  // get storage bucket
  const maps = await storage
    .bucket()
    .getFiles({ prefix: 'standmaps/', delimiter: '/' })

  const sortedMaps = maps[0]
    // omit root folder
    .filter((map) => map.name !== 'standmaps/')
    // make all images public
    .map((map) => {
      map.makePublic()
      return map // pass to next map
    })
    // only return the date and url
    .map((map) => {
      const date = map.name.split('standmaps/')[1].split('.')[0]
      return { date, url: map.metadata.mediaLink }
    })

  return sortedMaps
})
