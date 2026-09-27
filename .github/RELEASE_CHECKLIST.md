<!--
  The release checklist. The "Promote to production" workflow prints this file
  in its run summary, and the manager approving the release works through it
  before pressing Approve. Edit this file to change what a release requires.
-->

## Before approving

Tick each box only after actually doing it. Write what you observed next to
anything non-obvious — an unticked box with a note is far more useful than a
ticked box that nobody checked.

### Automated

- [ ] The `verify` job passed: the commit is on `dev`, `prod` can fast-forward to it, and `lint`, `typecheck`, `test` and `build` are green on it
- [ ] The `typecheck (vue, ratchet)` job has not regressed
- [ ] No new dependency warnings or Renovate security alerts introduced by this release

### Manually verified on the commit being released

- [ ] Front page loads, in both `nb-NO` and `en-US`
- [ ] Sign in, sign out, and sign up work
- [ ] An admin can create, edit and delete an event
- [ ] An admin can create, edit and delete a job listing
- [ ] Company pages render, including logos and images
- [ ] The QR code registration flow works end to end
- [ ] Checked on a narrow viewport (mobile) as well as desktop
- [ ] Browser console is free of new errors

### Configuration and data

- [ ] No new environment variables, or they are already set in Digital Ocean **and** documented in `.env.example`
- [ ] No Firebase schema or security rule changes, or they are already applied
- [ ] No breaking API changes for clients still running the old build

### Release hygiene

- [ ] Someone is available to watch the deploy and roll back if needed
- [ ] Not deploying immediately before an event, or immediately before everyone leaves for the day
- [ ] Rollback is known: redeploy the previous deployment from the Digital Ocean control panel, then fix forward on `dev`. Note anything that makes this harder, such as data migrations or new secrets

## After approving

Once Digital Ocean reports success:

- [ ] https://etdagen.no loads
- [ ] Spot-checked the specific features this release changed
- [ ] Deploy logs in the [Digital Ocean control panel](https://cloud.digitalocean.com/apps) show no errors
