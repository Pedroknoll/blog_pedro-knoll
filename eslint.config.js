import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginSvelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**",
      "dist-fixtures/**",
      ".astro/**",
      "node_modules/**",
      "public/notebooks/**",
      ".venv/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".lighthouseci/**",
      "lhci-report/**",
    ],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginSvelte.configs.recommended,
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    files: ["lighthouserc.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
