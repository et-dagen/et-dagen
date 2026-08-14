/**
 * Conventional Commits, enforced by the `commit-msg` husky hook and by the
 * advisory `pr title` CI job.
 *
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The conventional defaults plus `deploy`, which this repo already uses
    // for release commits. `minor` appears in history but is not a valid type
    // and is deliberately absent.
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'deploy',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
    // Merge and revert subjects routinely run long; 100 keeps the default
    // guard without tripping on them.
    'header-max-length': [2, 'always', 100],
  },
}
