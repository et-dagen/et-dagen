# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Admins (the IT group of E&T-dagene).** A few students who run the site's data all year, most
  intensely in the weeks around events and the fair. They work mostly on a laptop, and sometimes
  on a phone. The group changes every year, so each year new people learn the admin panel from
  scratch.
- **Company users.** Representatives of companies at the fair, using `/company/admin` to see
  their own events, who signed up, dietary needs and the résumés they have access to.
- **Coordinators (planned).** Students in E&T-dagene responsible for one or more companies. They
  replace today's company users and use the same pages as everyone else, with editing and
  registration controls added where they have rights, not a separate panel (`domain/user.ts`).

Students and visitors are the site's main audience, but they do not use the admin surfaces.

## Product Purpose

The website of E&T-dagene, a career fair run by students at NTNU: companies, events with
registration, job listings, résumés, and an admin panel. The admin panel is where the fair's data
is kept right: companies and their registration codes, events and their attendants, users and
their roles, and job listings. Success is that admins finish these jobs quickly and without
mistakes, including people who joined the IT group this year.

## Operating Context

- `/admin` has four panels: companies, events, jobs and users. Each is a list with filters,
  sorting, paging, selection and bulk delete, plus editing per item.
- Admin jobs, all equally important: companies and registration codes; events and attendants;
  users and roles; jobs.
- Used all year, peaking near events. Laptop first, but every admin job must also work on a phone.

## Capabilities and Constraints

- Nuxt 3 and Vuetify 3, with the theme in `config/vuetify/`. The front end talks only to the
  site's own API (`/api/v1`, later v2).
- Components and composables will be reshaped later (#557, #533). Admin work now should fix
  structure and flows and keep styling inside the existing theme and Vuetify, without rewriting
  component internals.
- All user-facing text exists in Norwegian (`nb-NO`) and British English (`en-GB`).
- The panels show personal data: names, emails, study programme, dietary needs and résumés.
  E&T-dagene is the data controller and erases users after three years of inactivity.
- Deleting users, companies, events or jobs cannot be undone today.

## Brand Commitments

- Name: E&T-dagene. Logos in `public/images/` (`logo.png`, `logo_long.png`, `logo_long_neg.png`).
- The incumbent theme's primary colour is `#A03836`. A public redesign is planned separately
  (#558) together with Markedsføring; the admin panel does not wait for it.

## Product Principles

1. Next year's IT group must understand every panel without being taught.
2. Actions on real people's data are deliberate: destructive ones are confirmed, named and, where
   possible, undoable.
3. Show only the personal data a task needs.
4. Every admin job works on a phone, not only on a laptop.
5. Structure before styling: the components will be rebuilt, so the flows and the information
   architecture are what must last.
