export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', 'lower-case'],
    'body-max-line-length': [0, 'always', 100],
  },
}
