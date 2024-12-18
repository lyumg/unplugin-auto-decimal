import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['**/*.md', 'examples/*'],
  rules: {
    'ts/explicit-function-return-type': 'off',
    'unicorn/consistent-function-scoping': 'off',
  },
})
