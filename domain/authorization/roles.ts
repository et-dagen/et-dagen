import type { RolesWithPermissions } from '@/domain/authorization/permissions'
import { can, canAny } from '@/domain/authorization/predicates'
import { admits, isOpen } from '@/domain/event/registration'

/**
 * What any student may do
 *
 * @remarks
 * Coordinators are students too, so this fragment is shared rather than restated. `satisfies`
 * supplies the contextual types, which is why the rule parameters need no annotations.
 */
const student = {
  resume: {
    read: (subject, resume) => resume.ownerUid === subject.uid,
    write: (subject, resume) => resume.ownerUid === subject.uid,
  },
  registration: {
    // The subject's own attributes are judged, which is only correct because the first conjunct
    // pins the applicant to the subject. Registering on behalf of another user is an admin-only
    // boolean leaf and never reaches here.
    create: (subject, target, env) =>
      target.targetUserUid === subject.uid &&
      isOpen(target.event.registration, env.now) &&
      admits(target.event.registration, subject),
    delete: (subject, target, env) =>
      target.targetUserUid === subject.uid &&
      isOpen(target.event.registration, env.now),
  },
  user: {
    read: true, // preserved verbatim — see "the hole left open" in the plan document
    update: (subject, account) => account.uid === subject.uid,
  },
} satisfies RolesWithPermissions['user']

/**
 * Every authorization rule in the application, in one place
 *
 * @remarks
 * A missing leaf is a denial, so a grant is only ever added, never negated. `event.delete` is
 * simply absent from `coordinator`; handing it over later is one line.
 *
 * Two asymmetries are deliberate. `company` has no `event.listAttendants` or `markAttended`,
 * because those endpoints are admin-only today and granting them here would be a new privilege.
 * `coordinator` has no `resume.read` at scope `all`, because the role has no legacy behaviour to
 * preserve and the narrower grant is the safer starting point.
 */
export const ROLES = {
  admin: {
    company: { create: true, update: true, delete: true },
    job: { create: true, update: true, delete: true },
    event: {
      create: true,
      update: true,
      delete: true,
      listAttendants: true,
      markAttended: true,
    },
    registration: { create: true, delete: true },
    resume: { read: true, write: true },
    user: { read: true, create: true, update: true, delete: true },
    code: { read: true, create: true, delete: true },
    image: { upload: true },
  },

  company: {
    company: {
      update: (subject, company) =>
        can(subject, company.uid, 'ent:profile:manage'),
    },
    job: {
      create: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
      update: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
      delete: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
    },
    event: {
      create: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
      update: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
      delete: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
    },
    resume: {
      read: (subject, resume) =>
        resume.scope === 'all' && canAny(subject, 'ent:resume:view'),
    },
    user: {
      read: true,
      update: (subject, account) => account.uid === subject.uid,
    },
  },

  // The company-user grants scoped to every associated company, minus event deletion, plus the
  // student entries — a coordinator is a student volunteer, not an employee.
  coordinator: {
    ...student,
    company: {
      update: (subject, company) =>
        can(subject, company.uid, 'ent:profile:manage'),
    },
    job: {
      create: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
      update: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
      delete: (subject, job) => can(subject, job.companyUid, 'ent:job:manage'),
    },
    event: {
      create: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
      update: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
      listAttendants: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
      markAttended: (subject, hosted) =>
        can(subject, hosted.companyUid, 'ent:event:manage'),
    },
  },

  user: student,
} satisfies RolesWithPermissions
