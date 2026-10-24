import type { Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'
import type { ISO8601String } from '@/domain/time/instant'
import type { UserUid } from '@/domain/user'
import { UUIDv4 } from '@/domain/uuid'

/**
 * Identifies a stored file
 *
 * @remarks
 * A random UUID, so a path never carries a name someone typed and two uploads never collide.
 */
export type FileId = Brand<UUIDv4, 'FileId'>

export const FileId = {
  /** @throws RangeError when the value is not a version 4 UUID */
  parse: (value: string): FileId => UUIDv4.parse(value) as FileId,
  random: (): FileId => UUIDv4.random() as FileId,
}

/** Who a file belongs to: a person, a company, or the fair itself */
export type FileOwner =
  | { kind: 'user'; uid: UserUid }
  | { kind: 'company'; uid: CompanyUid }
  | { kind: 'fair' }

export const FILE_KINDS = ['resume', 'avatar', 'logo', 'standmap'] as const
export type FileKind = (typeof FILE_KINDS)[number]

const MB = 1024 * 1024
const IMAGE = ['image/png', 'image/jpeg', 'image/webp'] as const

/** The owner, the formats and the size each kind of file allows */
export const FILE_RULES = {
  resume: {
    owner: 'user',
    types: ['application/pdf'],
    maxBytes: 10 * MB,
    single: true,
    public: false,
  },
  avatar: {
    owner: 'user',
    types: IMAGE,
    maxBytes: 2 * MB,
    single: true,
    public: false,
  },
  logo: {
    owner: 'company',
    types: IMAGE,
    maxBytes: 2 * MB,
    single: true,
    public: true,
  },
  standmap: {
    owner: 'fair',
    types: [...IMAGE, 'application/pdf'],
    maxBytes: 10 * MB,
    single: false,
    public: true,
  },
} as const satisfies Record<
  FileKind,
  {
    owner: FileOwner['kind']
    types: readonly string[]
    maxBytes: number
    /** An owner keeps only the newest file of this kind */
    single: boolean
    /** Anyone may open it by its lasting link; otherwise only through a temporary one */
    public: boolean
  }
>

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

/**
 * What is known about a stored file
 *
 * @remarks
 * The record is what says who owns a file, so erasing a person or a company finds every file by
 * owner instead of guessing from paths. Files someone uploaded for a company stay with the
 * company; the uploader is kept only to know who did it, and is cleared when that person is erased.
 */
export interface StoredFile {
  id: FileId
  owner: FileOwner
  kind: FileKind
  /** null once the uploader is erased, or when a script stored the file */
  uploader: UserUid | null
  /** The name it was uploaded with, shown to people; never part of the path */
  name: string
  contentType: string
  size: number
  createdAt: ISO8601String
}

/** Where an owner's files live, as a path prefix ending in a slash */
export function ownerPrefix(owner: FileOwner): string {
  switch (owner.kind) {
    case 'user':
      return `users/${owner.uid}/`
    case 'company':
      return `companies/${owner.uid}/`
    case 'fair':
      return 'fair/'
  }
}

/**
 * Where a file is stored, such as `users/<uid>/resumes/<id>.pdf`
 *
 * @remarks
 * Built only from the owner, the kind and the id, so nothing a client sends can choose the place.
 */
export const storagePathOf = (
  file: Pick<StoredFile, 'id' | 'owner' | 'kind' | 'contentType'>,
) =>
  `${ownerPrefix(file.owner)}${file.kind}s/${file.id}.${EXTENSIONS[file.contentType] ?? 'bin'}`

export type UploadProblem =
  | { kind: 'wrong-owner' }
  | { kind: 'unsupported-type'; allowed: readonly string[] }
  | { kind: 'too-large'; maxBytes: number }
  | { kind: 'empty' }

/** Why an upload of this kind cannot be stored, or null when it can */
export function uploadProblem(
  kind: FileKind,
  owner: FileOwner,
  contentType: string,
  size: number,
): UploadProblem | null {
  const rules = FILE_RULES[kind]
  if (owner.kind !== rules.owner) return { kind: 'wrong-owner' }
  if (!(rules.types as readonly string[]).includes(contentType)) {
    return { kind: 'unsupported-type', allowed: rules.types }
  }
  if (size === 0) return { kind: 'empty' }
  if (size > rules.maxBytes)
    return { kind: 'too-large', maxBytes: rules.maxBytes }
  return null
}

/** Whether two owners are the same person, company or the fair */
export const sameOwner = (a: FileOwner, b: FileOwner) =>
  a.kind === b.kind && (a.kind === 'fair' || a.uid === (b as typeof a).uid)
