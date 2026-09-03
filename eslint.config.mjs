import neostandard from 'neostandard'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// neostandard 0.13 bundles @stylistic v2, which breaks on ESLint 10. Swap in the v5
// plugin pinned in package.json and patch the three rule options v5 renamed.
// Same workaround as satisfactory-factories/web; drop it once neostandard catches up.
const styleConfigs = neostandard().map(config => {
  if (!config.rules) return config
  const rules = { ...config.rules }

  if (rules['@stylistic/func-call-spacing']) {
    rules['@stylistic/function-call-spacing'] = rules['@stylistic/func-call-spacing']
    delete rules['@stylistic/func-call-spacing']
  }

  const objectPropertyNewline = rules['@stylistic/object-property-newline']
  if (Array.isArray(objectPropertyNewline) && objectPropertyNewline[1]?.allowMultiplePropertiesPerLine !== undefined) {
    const [severity, { allowMultiplePropertiesPerLine, ...options }] = objectPropertyNewline
    rules['@stylistic/object-property-newline'] = [severity, {
      ...options,
      allowAllPropertiesOnSameLine: allowMultiplePropertiesPerLine,
    }]
  }

  delete rules['@stylistic/jsx-indent']
  delete rules['@stylistic/jsx-props-no-multi-spaces']

  const plugins = config.plugins?.['@stylistic']
    ? { ...config.plugins, '@stylistic': stylistic }
    : config.plugins

  return { ...config, ...(plugins ? { plugins } : {}), rules }
})

export default defineConfigWithVueTs(
  {
    ignores: ['node_modules/', 'dist/', 'public/', 'coverage/', 'site/', 'provisioning/'],
  },
  ...styleConfigs,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'sort-imports': ['warn', { ignoreDeclarationSort: true, ignoreCase: true }],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'only-multiline',
      }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/space-before-function-paren': ['error', { anonymous: 'always', named: 'always', asyncArrow: 'always' }],
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': ['error', { alphabetical: true }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      '@stylistic/indent': 'off',
      'vue/script-indent': ['error', 2, { baseIndent: 1, switchCase: 1 }],
      'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
      'vue/max-attributes-per-line': ['error', { singleline: 4, multiline: 1 }],
      'vue/no-v-html': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
)
