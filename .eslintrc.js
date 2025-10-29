module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Disallow dynamic import() expressions except when explicitly needed
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ImportExpression',
        message: 'Use static imports instead of dynamic import() unless necessary.',
      },
    ],
    // -- Formatting / stylistic rules (opinionated but industry-acceptable) --
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed'],
    'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
    // spacing between statements is stylistic — keep it off to avoid noisy warnings
    'padding-line-between-statements': 'off',

    // TypeScript specific relaxations that keep code readable
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // Keep line length reasonable but not extreme
    'max-len': ['warn', { code: 200, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],

    // Allow Windows/macOS line endings in development
    'linebreak-style': 'off',
  },
};


