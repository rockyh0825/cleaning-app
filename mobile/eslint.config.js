const boundaries = require("eslint-plugin-boundaries");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    // OpenAPI Generator による自動生成コードは lint 対象外
    ignores: ["src/shared/api/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      boundaries: boundaries,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      // TypeScript の拡張子解決: .ts / .tsx も自動解決する
      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
      },
      "boundaries/elements": [
        {
          type: "feature",
          pattern: "src/features/*",
          capture: ["featureName"],
        },
        { type: "capabilities", pattern: "src/capabilities/*" },
        { type: "shared", pattern: "src/shared/*" },
      ],
    },
    rules: {
      // feature-A → feature-B の直接 import を禁止。
      // 同一 feature 内・capabilities・shared への参照のみ許可する。
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "feature" },
              allow: [
                // 同一 feature 内の参照は許可（capture した featureName が一致する場合のみ）
                {
                  to: {
                    type: "feature",
                    captured: { featureName: "{{ from.captured.featureName }}" },
                  },
                },
                // capabilities・shared への参照は許可
                { to: { type: "capabilities" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "capabilities" },
              allow: [{ to: { type: "shared" } }],
            },
            {
              from: { type: "shared" },
              allow: [{ to: { type: "shared" } }],
            },
          ],
        },
      ],
    },
  },
];
