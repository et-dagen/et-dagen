import type { RolesWithPermissions } from '@/domain/authorization/permissions'
import { actsFor, can, canAny } from '@/domain/authorization/predicates'
import type { Subject } from '@/domain/authorization/subject'
import { isOrganiser, type CompanyUid } from '@/domain/business/company'
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
    // boolean leaf and never reaches here. Only the yes or no is used; a handler that wants to
    // say why calls `admits` itself for the verdict.
    create: (subject, target, env) =>
      target.targetUserUid === subject.uid &&
      isOpen(target.event.registration, env.now) &&
      admits(target.event.registration, subject.applicant).ok,
    delete: (subject, target, env) =>
      target.targetUserUid === subject.uid &&
      isOpen(target.event.registration, env.now),
  },
  user: {
    read: true, // what each role sees is narrowed by server/utils/userVisibility.ts
    update: (subject, account) => account.uid === subject.uid,
    delete: (subject, account) => account.uid === subject.uid,
  },
} satisfies RolesWithPermissions['user']

/**
 * Coordinators take attendance at the door: at E&T-dagene's own events, and at the events of the
 * companies they are responsible for whatever their tier, since it is E&T-dagene's work and not
 * something a company buys
 */
const takesAttendance = (subject: Subject, company: CompanyUid) =>
  isOrganiser(company) || actsFor(subject, company)

/**
 * Every authorization rule in the application, in one place
 *
 * @remarks
 * A missing leaf is a denial, so a grant is only ever added, never negated.
 *
 * Coordinators are E&T-dagene's own volunteers: they run their companies' events and every job
 * listing, whatever a company's contract. Company users edit their profile, manage their jobs and
 * read résumés as the contract allows, and see their events and who signed up, but leave the
 * events themselves to E&T-dagene.
 *
 * `company` has no `event.listAttendants` or `markAttended`: the attendee export and the door
 * scanner stay with E&T-dagene, and the company panel shows who signed up through `event.list`.
 * `coordinator` has no `resume.read` at scope `all`: résumés are sold to companies, and a
 * coordinator is a student.
 */
export const ROLES = {
  admin: {
    company: { create: true, update: true, delete: true, entitle: true },
    job: { create: true, update: true, delete: true },
    event: {
      create: true,
      update: true,
      delete: true,
      list: true,
      listAttendants: true,
      markAttended: true,
    },
    registration: { create: true, delete: true },
    resume: { read: true, write: true },
    user: {
      read: true,
      list: true,
      create: true,
      update: true,
      delete: true,
      assign: true,
    },
    code: { read: true, create: true, delete: true },
    image: { upload: true },
    board: { manage: true },
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
      list: (subject, hosted) => actsFor(subject, hosted.companyUid),
    },
    resume: {
      read: (subject, resume) =>
        resume.scope === 'all' && canAny(subject, 'ent:resume:view'),
    },
    user: {
      read: true,
      update: (subject, account) => account.uid === subject.uid,
      delete: (subject, account) => account.uid === subject.uid,
    },
  },

  // E&T-dagene's volunteer for some companies, and a student besides
  coordinator: {
    ...student,
    // a coordinator signs up as a student, except where they take attendance
    registration: {
      create: (subject, target, env) =>
        student.registration.create(subject, target, env) &&
        !takesAttendance(subject, target.event.companyUid),
      delete: student.registration.delete,
    },
    company: {
      update: (subject, company) => actsFor(subject, company.uid),
    },
    // a job is a listing, not part of a contract, so coordinators keep every company's
    job: { create: true, update: true, delete: true },
    event: {
      create: (subject, hosted) => actsFor(subject, hosted.companyUid),
      update: (subject, hosted) => actsFor(subject, hosted.companyUid),
      delete: (subject, hosted) => actsFor(subject, hosted.companyUid),
      list: (subject, hosted) => actsFor(subject, hosted.companyUid),
      listAttendants: (subject, hosted) =>
        takesAttendance(subject, hosted.companyUid),
      markAttended: (subject, hosted) =>
        takesAttendance(subject, hosted.companyUid),
    },
  },

  user: student,
} satisfies RolesWithPermissions
