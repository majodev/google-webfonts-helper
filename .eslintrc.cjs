module.exports = {
    ignorePatterns: [".eslintrc.cjs", "Gruntfile.js", "dist/**/*.js", "client/**/*.js"],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    parserOptions: {
        project: "./tsconfig.json"
    }
};