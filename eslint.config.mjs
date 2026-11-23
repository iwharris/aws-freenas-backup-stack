import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ['**/*.js', '**/*.d.ts', 'cdk.out/'],
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
                ...globals.es2019,
            },
            parserOptions: {
                ecmaVersion: 2019,
                sourceType: 'module',
            },
        },
    },
    ...tseslint.configs.recommended,
    prettierRecommended,
    {
        rules: {
            'prettier/prettier': 'warn',
            'no-unused-vars': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
        },
    },
);
