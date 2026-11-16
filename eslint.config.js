import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const restricoesSintaxeUi = [
  {
    selector:
      "CallExpression[callee.property.name='map'] ArrowFunctionExpression[body.type='ConditionalExpression']",
    message:
      'Evite ternário como corpo direto do callback de .map(); use bloco com if/return.',
  },
  {
    selector:
      "JSXExpressionContainer > ConditionalExpression[alternate.type='Literal'][alternate.raw='null'][consequent.type='JSXElement']",
    message:
      'Evite condição ? <elemento> : null em JSX; prefira condição && <elemento>.',
  },
  {
    selector:
      "JSXExpressionContainer > ConditionalExpression[consequent.type='Literal'][consequent.raw='null'][alternate.type='JSXElement']",
    message:
      'Evite condição ? null : <elemento> em JSX; prefira !condição && <elemento>.',
  },
  {
    selector:
      "JSXExpressionContainer > ConditionalExpression[alternate.type='Literal'][alternate.raw='null'][consequent.type='JSXFragment']",
    message:
      'Evite condição ? <fragmento> : null em JSX; prefira condição && <fragmento>.',
  },
  {
    selector:
      "JSXExpressionContainer > ConditionalExpression[consequent.type='Literal'][consequent.raw='null'][alternate.type='JSXFragment']",
    message:
      'Evite condição ? null : <fragmento> em JSX; prefira !condição && <fragmento>.',
  },
]

const restricoesSintaxeTestes = [
  {
    selector: 'SwitchStatement',
    message:
      'Evite switch em testes; prefira it.each / test.each ou describe com it explícitos.',
  },
  {
    selector: 'IfStatement',
    message:
      'Evite if/else em testes; prefira it.each / test.each ou describe com it explícitos.',
  },
  {
    selector: 'ConditionalExpression',
    message:
      'Evite operador ternário em testes; prefira it.each / test.each ou describe com it explícitos.',
  },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': ['error', ...restricoesSintaxeUi],
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restricoesSintaxeUi,
        ...restricoesSintaxeTestes,
      ],
    },
  },
])