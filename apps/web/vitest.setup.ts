import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
    cleanup();
})

// Next.js環境変数のモック
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Node.js環境の設定
if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
}

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
