import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
    cleanup();
});

const originalConsoleError = console.error;
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;
const suppressedConsoleErrors = [
    'Contact form submission error:',
    'Failed to fetch GitHub contributions:',
    'is an async Client Component. Only Server Components can be async at the moment.',
    'A component suspended inside an `act` scope, but the `act` call was not awaited.',
];

beforeEach(() => {
    consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation((...args) => {
        const [firstArg] = args;
        if (typeof firstArg === 'string') {
            const shouldSuppress = suppressedConsoleErrors.some((message) =>
                firstArg.includes(message)
            );
            if (shouldSuppress) {
                return;
            }
        }

        // Fallback to original behavior for unexpected errors.
        // eslint-disable-next-line no-console
        originalConsoleError(...args);
    });
});

afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = null;
});

// Next.js環境変数のモック
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

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
