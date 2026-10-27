import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { ImageProcessor } from '@/application/files/imageProcessor'
import {
  uploadFile,
  type FileDependencies,
} from '@/application/files/uploadFile'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { LOGO, type CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import { storagePathOf } from '@/domain/files/file'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

export interface LogoDependencies extends FileDependencies {
  companies: CompanyRepository
  images: ImageProcessor
}

/**
 * Trim a logo to what it shows, store it, and make it the company's logo
 *
 * @remarks
 * The file is recorded as the company's, so the older logo file is removed and erasing the
 * company finds it. The uploader is null when a script stores it.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `company/not-found`,
 *   `company/unreadable-logo`, `file/unsupported-type`, `file/empty` or `file/too-large`
 */
export async function setLogo(
  deps: LogoDependencies,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    company: CompanyUid
    name: string
    contentType: string
    bytes: Uint8Array
  },
): Promise<{ logo: string }> {
  const { subject, now, company } = request
  authorize(subject, 'company', 'update', { uid: company }, { now })
  return await storeLogo(deps, { ...request, uploader: subject.uid })
}

/**
 * {@link setLogo} without the permission check, for scripts an operator runs
 *
 * @throws AppError as {@link setLogo}, except the `auth/` codes
 */
export async function storeLogo(
  deps: LogoDependencies,
  request: {
    uploader: UserUid | null
    company: CompanyUid
    name: string
    contentType: string
    bytes: Uint8Array
  },
): Promise<{ logo: string }> {
  const [found] = await deps.companies.entitled([request.company])
  if (!found) throw fail('company/not-found')

  if (!(LOGO.types as readonly string[]).includes(request.contentType)) {
    throw fail('file/unsupported-type')
  }
  if (request.bytes.byteLength === 0) throw fail('file/empty')
  if (request.bytes.byteLength > LOGO.maxBytes) throw fail('file/too-large')

  const trimmed = await deps.images.trim(request.bytes, LOGO)
  if (!trimmed) throw fail('company/unreadable-logo')

  const file = await uploadFile(
    {
      kind: 'logo',
      owner: { kind: 'company', uid: request.company },
      uploader: request.uploader,
      name: request.name,
      contentType: trimmed.contentType,
      bytes: trimmed.bytes,
    },
    deps,
  )
  const logo = deps.storage.publicUrl(storagePathOf(file))
  await deps.companies.setLogo(request.company, logo)
  return { logo }
}
