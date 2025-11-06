module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: '18.2',
    },
  },
  plugins: ['react-refresh'],
  rules: {
    // React Refresh - warn on component exports
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // React specific rules
    'react/prop-types': 'off', // Disabled since you're not using PropTypes
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+

    // General JavaScript rules
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'no-console': 'off', // Allow console.log for now (can be changed later)
    'prefer-const': 'warn',
    'no-var': 'error',
  },
}
