'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GitHubRepository } from '../types';
import { fetchGitHubRepositoriesClient } from '../../../../lib/api/github';

interface UseGitHubReposResult {
    data: GitHubRepository[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * GitHubリポジトリを取得するカスタムフック
 */
export function useGitHubRepos(
    initialData?: GitHubRepository[],
    limit = 20,
): UseGitHubReposResult {
    const [data, setData] = useState<GitHubRepository[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const repositories = await fetchGitHubRepositoriesClient(limit);
            setData(repositories);
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to fetch repositories');
            setError(error);
            console.error('Failed to fetch GitHub repositories:', error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        if (!initialData) {
            fetchData();
        }
    }, [initialData, fetchData]);

    const refetch = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch,
    };
}

