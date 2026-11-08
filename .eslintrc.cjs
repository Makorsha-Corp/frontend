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
  plugins: ['react-refresh', 'i18next'],
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
    {
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: ['src/lib/appToast.ts', 'src/components/AppToaster.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-hot-toast',
                message: 'Use appToast from @/lib/appToast instead.',
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        'src/i18n/**/*.{ts,tsx}',
        'src/components/newcomponents/customui/settings/**/*.{ts,tsx}',
        'src/components/newcomponents/customui/UiLanguageToggle.tsx',
        'src/pages/newpages/LoginPage.tsx',
        'src/components/newcomponents/customui/DashboardNavbar.tsx',
        'src/pages/newpages/orders/OrdersOverviewPage.tsx',
        'src/pages/newpages/ItemsPage.tsx',
        'src/pages/newpages/StoragePage.tsx',
        'src/pages/newpages/ProductionPage.tsx',
        'src/pages/newpages/AccountsLandingPage.tsx',
      ],
      rules: {
        'i18next/no-literal-string': [
          'warn',
          {
            markupOnly: true,
            ignoreAttribute: [
              'className',
              'data-testid',
              'type',
              'id',
              'name',
              'role',
              'to',
              'href',
              'variant',
              'size',
              'value',
              'mode',
              'tourId',
              'aria-hidden',
            ],
          },
        ],
      },
    },
  ],
}
