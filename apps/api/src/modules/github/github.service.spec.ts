import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ServiceUnavailableException } from '@nestjs/common';
import { GithubService } from './github.service';
import { CacheService } from '../cache/cache.service';

describe('GithubService', () => {
  let service: GithubService;
  let cacheService: jest.Mocked<CacheService>;
  let logger: jest.Mocked<Logger>;

  const mockRepositories = [
    {
      id: 123456,
      name: 'test-repo',
      description: 'A test repository',
      html_url: 'https://github.com/testuser/test-repo',
      stargazers_count: 10,
      forks_count: 5,
      language: 'TypeScript',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  const expectedRepositoryDto = {
    id: '123456',
    name: 'test-repo',
    description: 'A test repository',
    url: 'https://github.com/testuser/test-repo',
    starCount: 10,
    forkCount: 5,
    primaryLanguage: 'TypeScript',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockContributionCalendar = {
    totalContributions: 100,
    weeks: [
      {
        contributionDays: [
          { date: '2025-01-01', contributionCount: 5, color: '#40c463' },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GITHUB_TOKEN: 'test-token',
          GITHUB_USERNAME: 'testuser',
        };
        return config[key] || '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    cacheService = module.get(CacheService);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPublicRepositories', () => {
    it('should return cached repositories if available', async () => {
      const cachedResult = {
        repositories: [expectedRepositoryDto],
        pagination: { page: 1, perPage: 20, hasMore: false },
      };

      cacheService.get.mockReturnValue(cachedResult);

      const result = await service.getUserPublicRepositories(20, 1);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        'github:repositories:20:page1',
      );
      expect(logger.log).toHaveBeenCalledWith(
        'GitHub repositories served from cache (page 1, 1 items)',
      );
    });

    it('should fetch repositories from API when cache is empty', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepositories),
        headers: {
          get: (key: string) => {
            const headers: Record<string, string> = {
              'x-ratelimit-limit': '60',
              'x-ratelimit-remaining': '59',
              'x-ratelimit-reset': '1704067200',
            };
            return headers[key.toLowerCase()] || null;
          },
        },
      } as Response);

      const result = await service.getUserPublicRepositories(20, 1);

      expect(result.repositories).toHaveLength(1);
      expect(result.repositories[0]).toMatchObject(expectedRepositoryDto);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 20,
        hasMore: false,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        'github:repositories:20:page1',
        expect.any(Object),
        900,
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        'github:repositories:20:page1:stale',
        expect.any(Object),
        3600,
      );

      fetchSpy.mockRestore();
    });

    it('should return empty list when GITHUB_USERNAME is not configured', async () => {
      const emptyConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'GITHUB_USERNAME') return '';
          if (key === 'GITHUB_TOKEN') return 'test-token';
          return defaultValue || '';
        }),
      };

      const emptyUserService = new GithubService(
        emptyConfigService as unknown as ConfigService,
        logger,
        cacheService,
      );

      const result = await emptyUserService.getUserPublicRepositories(20, 1);

      expect(result.repositories).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 20,
        hasMore: false,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'GITHUB_USERNAME is not configured, returning empty list.',
      );
    });

    it('should use stale cache on API error', async () => {
      const staleResult = {
        repositories: [expectedRepositoryDto],
        pagination: { page: 1, perPage: 20, hasMore: false },
      };

      cacheService.get.mockImplementation((key: string) => {
        if (key === 'github:repositories:20:page1') return null;
        if (key === 'github:repositories:20:page1:stale') return staleResult;
        return null;
      });

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      const result = await service.getUserPublicRepositories(20, 1);

      expect(result).toEqual(staleResult);
      expect(logger.warn).toHaveBeenCalledWith(
        'GitHub API error, serving stale cache (page 1, 1 items)',
      );

      fetchSpy.mockRestore();
    });

    it('should throw ServiceUnavailableException when no cache available', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await expect(service.getUserPublicRepositories(20, 1)).rejects.toThrow(
        ServiceUnavailableException,
      );

      fetchSpy.mockRestore();
    });

    it('should cap limit to 100', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepositories),
        headers: {
          get: () => null,
        },
      } as unknown as Response);

      await service.getUserPublicRepositories(1000, 1);

      const fetchUrl = fetchSpy.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('per_page=100');

      fetchSpy.mockRestore();
    });

    it('should set hasMore to true when returned items equal perPage', async () => {
      cacheService.get.mockReturnValue(null);

      // 20件のリポジトリを返す
      const manyRepos = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockRepositories[0],
          id: i,
          name: `repo-${i}`,
        }));

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(manyRepos),
        headers: {
          get: () => null,
        },
      } as unknown as Response);

      const result = await service.getUserPublicRepositories(20, 1);

      expect(result.pagination.hasMore).toBe(true);

      fetchSpy.mockRestore();
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit info from cache', () => {
      const rateLimitInfo = {
        limit: 60,
        remaining: 59,
        resetAt: 1704067200,
      };

      cacheService.get.mockReturnValue(rateLimitInfo);

      const result = service.getRateLimitInfo();

      expect(result).toEqual(rateLimitInfo);
      expect(cacheService.get).toHaveBeenCalledWith('github:rate-limit');
    });

    it('should return null when no rate limit info is cached', () => {
      cacheService.get.mockReturnValue(null);

      const result = service.getRateLimitInfo();

      expect(result).toBeNull();
    });
  });

  describe('getContributionCalendar', () => {
    it('should return cached contribution calendar if available', async () => {
      cacheService.get.mockReturnValue(mockContributionCalendar);

      const result = await service.getContributionCalendar();

      expect(result).toEqual(mockContributionCalendar);
      expect(cacheService.get).toHaveBeenCalledWith('github:contributions');
      expect(logger.log).toHaveBeenCalledWith(
        'GitHub contributions served from cache',
      );
    });

    it('should fetch contribution calendar from GraphQL API when cache is empty', async () => {
      cacheService.get.mockReturnValue(null);

      const mockGraphQLResponse = {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockContributionCalendar,
            },
          },
        },
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGraphQLResponse),
      } as Response);

      const result = await service.getContributionCalendar();

      expect(result).toEqual(mockContributionCalendar);
      expect(cacheService.set).toHaveBeenCalledWith(
        'github:contributions',
        mockContributionCalendar,
        900,
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        'github:contributions:stale',
        mockContributionCalendar,
        3600,
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Fetched 100 contributions from GitHub GraphQL API',
      );

      fetchSpy.mockRestore();
    });

    it('should return empty calendar when GITHUB_USERNAME is not configured', async () => {
      const emptyConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'GITHUB_USERNAME') return '';
          if (key === 'GITHUB_TOKEN') return 'test-token';
          return defaultValue || '';
        }),
      };

      const emptyUserService = new GithubService(
        emptyConfigService as unknown as ConfigService,
        logger,
        cacheService,
      );

      const result = await emptyUserService.getContributionCalendar();

      expect(result).toEqual({
        totalContributions: 0,
        weeks: [],
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'GITHUB_USERNAME is not configured, returning empty contribution calendar.',
      );
    });

    it('should use stale cache on GraphQL API error', async () => {
      cacheService.get.mockImplementation((key: string) => {
        if (key === 'github:contributions') return null;
        if (key === 'github:contributions:stale') return mockContributionCalendar;
        return null;
      });

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      const result = await service.getContributionCalendar();

      expect(result).toEqual(mockContributionCalendar);
      expect(logger.warn).toHaveBeenCalledWith(
        'GitHub GraphQL API error, serving stale cache',
      );

      fetchSpy.mockRestore();
    });

    it('should throw ServiceUnavailableException when no cache available on GraphQL error', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await expect(service.getContributionCalendar()).rejects.toThrow(
        ServiceUnavailableException,
      );

      fetchSpy.mockRestore();
    });

    it('should throw ServiceUnavailableException when GITHUB_TOKEN is not configured', async () => {
      const noTokenConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'GITHUB_USERNAME') return 'testuser';
          if (key === 'GITHUB_TOKEN') return '';
          return defaultValue || '';
        }),
      };

      const noTokenService = new GithubService(
        noTokenConfigService as unknown as ConfigService,
        logger,
        cacheService,
      );

      // キャッシュなしを返す
      cacheService.get.mockReturnValue(null);

      await expect(noTokenService.getContributionCalendar()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('refreshContributionCalendar', () => {
    it('should clear cache and fetch fresh data', async () => {
      cacheService.get.mockReturnValue(null);

      const mockGraphQLResponse = {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockContributionCalendar,
            },
          },
        },
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGraphQLResponse),
      } as Response);

      const result = await service.refreshContributionCalendar();

      expect(cacheService.delete).toHaveBeenCalledWith('github:contributions');
      expect(result).toEqual(mockContributionCalendar);
      expect(logger.log).toHaveBeenCalledWith(
        'GitHub contributions cache cleared for refresh',
      );

      fetchSpy.mockRestore();
    });
  });
});
