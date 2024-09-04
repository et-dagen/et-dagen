module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: { parser: '@typescript-eslint/parser' },
  extends: ['@nuxtjs/eslint-config-typescript', 'plugin:prettier/recommended'],
  overrides: [
    {
      files: ['**/*.vue'],
      processor: 'vue/.vue',
      rules: { indent: 'off' },
    },
  ],
  plugins: [],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: false,
        tabWidth: 2,
        vueIndentScriptAndStyle: true,
        endOfLine: 'auto',
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/no-unused-vars': 'error',
    'arrow-spacing': [
      'error',
      {
        before: true,
        after: true,
      },
    ],
    'brace-style': 'error',
    camelcase: 'error',
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline', // Always enforce trailing commas in multi-line arrays
        objects: 'always-multiline', // Always enforce trailing commas in multi-line objects
        imports: 'only-multiline', // Enforce trailing commas in multi-line imports
        exports: 'only-multiline', // Enforce trailing commas in multi-line exports
        functions: 'only-multiline', // Do not enforce trailing commas in function parameters and arguments
      },
    ],

    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    'comma-style': ['error', 'last'],
    'dot-notation': ['error', { allowKeywords: true }],
    eqeqeq: ['error', 'smart'],
    'func-call-spacing': ['error', 'never'],
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      },
    ],
    'keyword-spacing': [
      'error',
      {
        before: true,
        after: true,
      },
    ],
    'vue/multi-word-component-names': 'off',
    'vue/max-len': [
      'error',
      {
        code: 100,
        template: 100,
        tabWidth: 2,
        comments: 100,
        ignorePattern: '',
        ignoreComments: true,
        ignoreTrailingComments: false,
        ignoreUrls: false,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
        ignoreRegExpLiterals: true,
        ignoreHTMLAttributeValues: false,
        ignoreHTMLTextContents: false,
      },
    ],
    'no-constant-condition': 'error',
    'vue/no-irregular-whitespace': [
      'error',
      {
        skipStrings: true,
        skipComments: false,
        skipRegExps: false,
        skipTemplates: false,
        skipHTMLAttributeValues: false,
        skipHTMLTextContents: false,
      },
    ],
    'no-loss-of-precision': 'error',
    'no-sparse-arrays': 'error',
    'no-useless-concat': 'error',
    'object-curly-newline': 'off',
    'object-curly-spacing': [
      'error',
      'always',
      {
        arraysInObjects: true,
        objectsInObjects: true,
      },
    ],
    'object-property-newline': [
      'error',
      { allowAllPropertiesOnSameLine: true },
    ],
    'prefer-template': 'error',
    'quote-props': 'error',
    'space-in-parens': 'error',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
  },
}
