const path = require('path');

module.exports = [
  {
    root: true,
    ignores: [
      'node_modules/',
      'dist/',
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'server/utils/firebase.ts',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
      },
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    plugins: ['prettier', '@typescript-eslint'],
    extends: ['@nuxtjs', 'plugin:@typescript-eslint/recommended'],
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
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'only-multiline',
          exports: 'only-multiline',
          functions: 'never',
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
          code: 80,
          template: 80,
          tabWidth: 2,
          comments: 80,
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
      // Add any other relevant rules from @typescript-eslint
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['**/*.vue'],
    processor: 'vue/.vue',
    rules: {
      indent: 'off',
    },
  },
];
