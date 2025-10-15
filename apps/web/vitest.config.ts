import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                'tests-examples/',
                '.next/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/dist/**',
            ],
        },
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/tests/**',
            '**/tests-examples/**',
            '**/.next/**',
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '@/components': path.resolve(__dirname, './components'),
            '@/lib': path.resolve(__dirname, './lib'),
            '@/app': path.resolve(__dirname, './app'),
            '@/styles': path.resolve(__dirname, './styles'),
        },
    },
});
