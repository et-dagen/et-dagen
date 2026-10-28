// PUT /api/v1/company/logo
// endpoint for a company's logo
import { setLogo } from '@/application/companies/logo'
import { CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { companies, fileStorage, files, images } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: "Upload a company's logo",
    description:
      'Admin, or a company user for their own company. Multipart with the company in the part ' +
      'named `companyUID` and the picture in the part named `file`: PNG, JPEG or WebP, at most ' +
      '10 MB. Its plain margin is cut away, it is scaled to fit 800 x 800 and stored as WebP, ' +
      'and it replaces the old logo. Answers with `{ logo }`, the new link.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const parts = await readMultipartFormData(event)
  const companyUID = parts
    ?.find((part) => part.name === 'companyUID')
    ?.data.toString()
  const file = parts?.find((part) => part.name === 'file')
  setResourceContext(
    event,
    'company',
    companyUID,
    'update',
    "Upload a company's logo",
  )
  if (!companyUID || !file?.filename) throw fail('company/missing-logo')
  addEventContext(event, 'file_size', file.data.byteLength)

  return setLogo(
    { companies, files, storage: fileStorage, images, now: Instant.now },
    {
      subject,
      now: Instant.now(),
      company: CompanyUid.parse(companyUID),
      name: file.filename,
      contentType: file.type ?? '',
      bytes: new Uint8Array(file.data),
    },
  )
})
