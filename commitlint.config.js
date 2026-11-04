/** Conventional Commits — drives changelog drafting (git-cliff) and release notes. */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'web',
        'domain',
        'brand',
        'design-system',
        'i18n',
        'seo',
        'db',
        'auth',
        'qr',
        'ci',
        'deps',
        'docs',
        'release',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'body-max-line-length': [1, 'always', 120],
  },
};
