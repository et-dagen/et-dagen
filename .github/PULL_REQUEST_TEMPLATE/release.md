<!--
  Title this pull request: deploy: release <date>

  This is the release checklist for merging `dev` into `prod`. Merging this PR
  deploys to production via Digital Ocean.

  Merge with a MERGE COMMIT, never a squash — squashing breaks shared ancestry
  between dev and prod and causes conflicts on every later release.

  Requires an approval from @et-dagen/managers.
-->

## What is being released

<!-- Summarise the user-visible changes. Link the PRs or issues included. -->

## Rollback plan

<!--
  How do we get back if this goes wrong? Usually: redeploy the previous
  successful deployment from the Digital Ocean control panel. Note anything
  that makes rollback harder — data migrations, changed env vars, new secrets.
-->

---

## Pre-merge checklist

Tick each box only after actually doing it. Write what you observed next to
anything non-obvious — an unticked box with a note is far more useful than a
ticked box that nobody checked.

### Automated

- [ ] CI is green on this PR (`lint`, `typecheck`, `test`, `build`)
- [ ] The `typecheck (vue, ratchet)` job has not regressed
- [ ] No new dependency warnings or Renovate security alerts introduced by this release

### Manually verified against `dev`

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

## Testing notes

<!--
  What did you actually test, on what, and what did you see? Include anything
  you could not test and why.
-->

## Post-deploy verification

To be completed by whoever merges, after Digital Ocean reports success:

- [ ] https://etdagen.no loads
- [ ] Spot-checked the specific features this release changed
- [ ] Deploy logs in the [Digital Ocean control panel](https://cloud.digitalocean.com/apps) show no errors
