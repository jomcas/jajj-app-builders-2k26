// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Props that put text in front of the hiker or a screen reader. Their values must come
// from a string catalog, never a literal.
const TEXT_PROPS = '/^(accessibilityLabel|accessibilityHint|aria-label|placeholder|title|label)$/';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/*', 'ios/*', 'dist/*', '.expo/*'],
  },
  {
    // The registry has no exports until the first Feature Module is added.
    files: ['src/modules/index.ts'],
    rules: { 'import/namespace': 'off' },
  },
  {
    // No hard-coded UI text: every visible string comes from a catalog (src/i18n/types.ts).
    files: ['src/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name=${TEXT_PROPS}] Literal[value=/[A-Za-z]/]`,
          message: 'UI text must come from a string catalog (useStrings), not a literal.',
        },
        {
          selector: `JSXAttribute[name.name=${TEXT_PROPS}] TemplateLiteral`,
          message: 'UI text must come from a string catalog (useStrings), not a literal.',
        },
      ],
    },
  },
]);
