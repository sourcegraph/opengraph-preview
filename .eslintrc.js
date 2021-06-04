// @ts-check

const config = {
  extends: '@sourcegraph/eslint-config',
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
    project: __dirname + '/tsconfig.json',
  },
  plugins: ['@sourcegraph/sourcegraph'],
}

module.exports = config
