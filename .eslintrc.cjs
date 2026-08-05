module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/legacy-reference'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Node-side CommonJS config files (tailwind, postcss, ...)
      files: ['*.config.js', '*.config.cjs'],
      env: { node: true },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
      ],
      plugins: ['react-refresh', '@typescript-eslint', 'unused-imports'],
      rules: {
        'react/jsx-no-target-blank': 'off',
        'react/prop-types': 'off',
        // HMR-only concern; this codebase intentionally co-locates variants,
        // context hooks, and helpers with their components (shadcn pattern).
        'react-refresh/only-export-components': 'off',
        // unused-imports owns unused-code diagnostics (it can autofix);
        // the overlapping @typescript-eslint rule is disabled so only one
        // rule reports each problem.
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
}
