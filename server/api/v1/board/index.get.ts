// GET /api/v1/board
// endpoint for the board members on the contact page
import { listBoard } from '@/application/board/members'
import { board, fileStorage, files } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: 'List the board',
    description:
      'Public. The board members in their order on the contact page, each with a title in ' +
      'Norwegian and English, email, phone and the public link of their portrait (800 x 960 ' +
      'WebP), or null. `featured` marks the contact for companies.',
    security: [],
  },
})

export default defineEventHandler((event) => {
  setLogImportance(event, 'debug')
  setResourceContext(event, 'board', undefined, 'list', 'List the board')
  return listBoard({ board, files, storage: fileStorage })
})
