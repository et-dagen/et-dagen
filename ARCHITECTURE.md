# Architecture

How the site is put together today, the shape it is moving towards, and the rules that keep the two
apart while both exist. The domain-driven design is implemented as a **hexagonal architecture**
(ports and adapters); that is the only target layout for new server code. The reasoning behind the direction is on the wiki's "Domain-driven design" and
"Access control" pages; the work itself is tracked in the milestones _Domain-driven architecture_,
_API and presentation boundaries_ and _PostgreSQL migration_.

## Today

```
Browser (Vue pages, Pinia stores, Firebase Auth client)
   │  fetch /api/v1/*   (Firebase ID token in a header or cookie)
   ▼
Nitro server
   server/middleware/00.wideEvent.ts   one structured log record per request
   server/middleware/auth.ts           verifies the ID token
   server/middleware/user.ts           builds event.context.subject, and keeps event.context.user for v1
   server/api/v1/**                    handlers: validate, authorize, read and write Firebase
   ▼
Firebase Admin SDK: Realtime Database, Cloud Storage, Auth
```

- The browser uses Firebase only to sign in. Every database and storage call happens on the server,
  so the data store can change without touching the front end.
- Handlers mix request parsing, rules, authorization and storage calls in one function.
  That is what the migration removes.
- Realtime Database nodes: `users`, `companies`, `events` (with `attendants` and `queue`), `jobs`,
  `studyProgrammes`, `generalInfo`. The stored data has drifted from the types
  in `models/` (#543); treat what is stored as untrusted and parse it.

## Target: hexagonal architecture

The domain and the use cases sit in the middle and know nothing about Nitro, Firebase or
SQL. The outside talks to the middle through ports, which are TypeScript interfaces, and adapters
implement them. One composition root chooses the adapters.

```mermaid
flowchart TB
  subgraph inbound[Inbound adapters]
    v1[server/api/v1]
    v2[server/api/v2]
  end
  subgraph core[Core]
    app[application/: use cases and ports]
    dom[domain/: entities, rules, authorization]
  end
  subgraph outbound[Outbound adapters]
    rtdb[server/adapters/rtdb]
    mem[server/adapters/memory]
    pg[server/adapters/postgres, later]
  end
  root[server/plugins/container.ts: composition root]
  v1 --> app
  v2 --> app
  app --> dom
  rtdb -. implements ports .-> app
  mem -. implements ports .-> app
  pg -. implements ports .-> app
  root --> rtdb
  root --> mem
```

| Directory                               | Holds                                                            | May import                      |
| --------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| `domain/`                               | Entities, value objects, rules, permission table                 | Only `domain/`                  |
| `application/`                          | Use cases, and the ports they need                               | `domain/`, `application/`       |
| `server/adapters/`                      | Port implementations for each store                              | `domain/`, `application/`, SDKs |
| `server/api/`                           | Route handlers: parse, call one use case, map the result to HTTP | Everything above                |
| `server/plugins/container.ts` (planned) | Builds adapters once and puts them on the request                | Everything above                |

Dependency injection is plain functions: a use case takes its ports as arguments. There is no DI
framework.

`tests/architecture.spec.ts` fails the build if `domain/` or `application/` imports anything
outside the directories allowed above.

The first port is `EventRepository` in `application/events/`. Every adapter for a port must pass
that port's contract suite (`tests/application/**/*.contract.ts`), which the adapter's own test
file runs with a factory. The in-memory adapter is the reference implementation.

A port method performs a whole operation, such as "register or waitlist this user", not a separate
read and write. Each adapter then does it atomically in its own way, and a later PostgreSQL adapter
can replace the Realtime Database one without changing the use cases.

## Front end

The browser side is a Nuxt app. Business rules stay in `domain/` and are shared with the server;
the front end only presents them.

| Directory        | Holds                                                                                  | May import                                           |
| ---------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `pages/`         | Routes: load the data, put components together, declare `definePageMeta`               | Everything below, never another page                 |
| `components/`    | Vue components, one folder per area (`admin/`, `event/`, `user/`, …)                   | Their own area, `ui/`, `common/`, `form/`, and below |
| `components/ui/` | shadcn-vue components, copied into the repo                                            | `lib/utils`                                          |
| `composables/`   | Functions that need Vue or Nuxt while they run                                         | `stores/`, `lib/`, `contracts/`, `domain/`           |
| `stores/`        | Pinia state shared across pages (the signed-in user and subject)                       | `lib/`, `domain/`                                    |
| `lib/`           | Plain TypeScript for presentation: view models, formatting, form mapping, list helpers | `lib/`, `contracts/`, `domain/`                      |
| `contracts/`     | Zod schemas for request bodies and forms, used by the client and the server            | `domain/`                                            |

The server imports none of `pages/`, `components/`, `composables/`, `layouts/` or `stores/`.
`tests/architecture.spec.ts` checks that, the ban on importing a page, the component areas, and
that `lib/` neither imports nor calls anything that needs Vue or Nuxt at runtime.

### Composable or `lib/`?

Ask what the code needs while it runs.

- **It needs Vue or Nuxt: a composable.** It calls `ref`, `computed`, `watch`, a lifecycle hook,
  `useFetch`, `$fetch`, `useI18n`, `useRoute`, `navigateTo`, a store or the Firebase client. It
  runs only inside a component's `setup` or another composable. Name it `useX` (`useSort`,
  `useResourceForm`) and give it one job: own some reactive state, load one thing, or wire one
  browser API.
- **It needs nothing but its arguments: `lib/`.** Data in, data out: `eventStatus(event, now)`,
  `jobFormOf(job)`, `pageOf(rows, page, size)`. Pass in what would otherwise come from the
  framework, such as the clock, the locale or a translate function. Name it after the value it
  returns. It runs anywhere, including the server and scripts.
- **It is a rule of the business: `domain/`.** Who may register, when sign-up opens, what a tier
  entitles a company to. The server must enforce it too, so it cannot live in the front end.

Prefer `lib/`. A composable should be a thin reactive layer over `lib/` functions, so the logic
is tested with a plain Vitest call (`tests/lib/`) instead of a mounted component, and components
stay presentational (#557). When a component grows a calculation, move it to `lib/`; when several
components repeat the same reactive wiring, move that to a composable.

## Authorization

- **ABAC:** a per-request `Subject` (uid, roles, per-company entitlements, and the student
  attributes eligibility may judge) is checked by `hasPermission` against the permission table in
  `domain/authorization`. Roles bundle permissions; companies hold entitlements; a coordinator gets the
  entitlements of each company they are associated with. Event eligibility rules live in
  `domain/authorization/eligibility.ts` and explain refusals. The core is in review in #517. The
  subject is built once per request in `server/middleware/user.ts` (#519). Use cases check it with
  `authorize` in `domain/authorization/authorize.ts`, the one place a denial is raised: status 401
  with `auth/signed-out` when nobody is signed in, 403 with `auth/forbidden` when the table says
  no. The caller passes the clock. Every v1 handler decides this way (#521); roles, company memberships and
  affiliations are stored under `roles/`, `memberships/` and `affiliations/` (#640), and only those
  decide access; the v1 `userType`, `companyUID`, `type` and `cvAccess` fields no longer do.

## Logging

Every request produces one wide event: a single structured record carrying everything known about
it. Handlers add to it with `setResourceContext`, `addEventContext`, `setErrorContext` and the
database timing helpers in `server/utils/wideEventHelpers.ts`. Routine reads are not logged; changes,
listings of personal data, warnings, errors and slow requests always are (`server/utils/logger.ts`).

Errors are logged and answered in one place. Code throws `fail(code)` from `domain/errors`, whose
catalogue gives each code its status and developer message. The Nitro error handler in
`server/errors/` records the error, its causes and, for server errors, the stack on the wide event,
and answers API requests with the code and the request id. Anything else that is thrown becomes
`internal/unexpected`. The client translates the code for the user.

## Tests

All tests live under `tests/`, mirroring the source path.

| Layer      | Covers                                                                  | Status                 |
| ---------- | ----------------------------------------------------------------------- | ---------------------- |
| Unit       | Domain rules and use cases, using in-memory adapters                    | In place for `domain/` |
| Contract   | One suite per port that every adapter must pass                         | Planned                |
| API        | Every endpoint's status codes and bodies against the Firebase emulators | Started with events    |
| End to end | A few user journeys in a browser                                        | Planned                |

Replace a port with an in-memory adapter in tests; do not mock the domain.

## Where the migration stands

1. Domain layer: merged (#515).
2. ABAC core: in review (#517). Generated API docs (#544) and the release workflow (#545) are also in review.
3. Next: tests that pin down v1 behaviour, then events and registration as the first feature running
   through ports, use cases and an RTDB adapter (#518–#520, #523–#525).
4. Then API v2, one domain at a time (#534, #533, #522, #521).
5. Later: Docker for local development, a move off App Platform, PostgreSQL and backups (#526–#532).

While both shapes exist: new rules go in `domain/`, new endpoints use the target layout, and v1
handlers only change to fix bugs or to call a use case.
