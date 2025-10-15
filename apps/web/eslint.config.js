import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...nextJsConfig,
    {
        // 型定義ファイル（.d.ts）用の特別なルール設定
        files: ["**/*.d.ts"],
        rules: {
            // 型拡張（Type Augmentation）では空のインターフェースが正当なパターン
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
];
