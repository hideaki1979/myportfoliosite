/// <reference types="vitest" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
    interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {
        // Vitest の Assertion 型を Testing Library のマッチャーで拡張
        // このインターフェースは型拡張のためのもので、実装は @testing-library/jest-dom が提供
    }
}
