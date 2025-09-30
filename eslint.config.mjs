import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    ignores: ["build/**", "dist/**", "coverage/**"]
  },
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "module" }
  },
  {
    files: ["**/*.js"],
    ignores: ["src/**/*.js"],
    languageOptions: { sourceType: "script" }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        global: "readonly"
      }
    }
  }
]);
