import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ServiceUnavailableException } from '@nestjs/common';
import { QiitaService } from './qiita.service';
import { CacheService } from '../cache/cache.service';

describe('QiitaService', () => {
  let service: QiitaService;
  let cacheService: jest.Mocked<CacheService>;
  let logger: jest.Mocked<Logger>;

  const mockArticles = [
    {
      id: 'article1',
      title: 'Test Article',
      url: 'https://qiita.com/testuser/items/article1',
      likes_count: 10,
      stocks_count: 5,
      created_at: '2025-01-01T00:00:00Z',
      tags: [
        {
          name: 'TypeScript',
          versions: ['5.0'],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
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
          QIITA_TOKEN: 'test-token',
          QIITA_USER_ID: 'testuser',
        };
        return config[key] || '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QiitaService,
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

    service = module.get<QiitaService>(QiitaService);
    cacheService = module.get(CacheService);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserArticles', () => {
    it('should return cached articles if available', async () => {
      const cachedArticles = [
        {
          id: 'article1',
          title: 'Cached Article',
          url: 'https://qiita.com/testuser/items/article1',
          likesCount: 10,
          stocksCount: 5,
          createdAt: '2025-01-01T00:00:00Z',
          tags: [{ name: 'TypeScript', versions: ['5.0'] }],
        },
      ];

      cacheService.get.mockReturnValue(cachedArticles);

      const result = await service.getUserArticles(10);

      expect(result).toEqual(cachedArticles);
      expect(cacheService.get).toHaveBeenCalledWith('qiita:articles:10');
      expect(logger.log).toHaveBeenCalledWith(
        'Qiita articles served from cache (1 items)',
      );
    });

    it('should fetch articles from API when cache is empty', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockArticles),
        headers: {
          get: (key: string) => {
            const headers: Record<string, string> = {
              'rate-limit': '1000',
              'rate-remaining': '999',
              'rate-reset': '1704067200',
            };
            return headers[key.toLowerCase()] || null;
          },
        },
      } as Response);

      const result = await service.getUserArticles(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'article1',
        title: 'Test Article',
        url: 'https://qiita.com/testuser/items/article1',
        likesCount: 10,
        stocksCount: 5,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        'qiita:articles:10',
        expect.any(Array),
        900,
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        'qiita:articles:10:stale',
        expect.any(Array),
        3600,
      );

      fetchSpy.mockRestore();
    });

    it('should return empty array when QIITA_USER_ID is not configured', async () => {
      // QIITA_USER_IDが空の設定で新しいサービスインスタンスを作成
      const emptyConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'QIITA_USER_ID') return '';
          if (key === 'QIITA_TOKEN') return 'test-token';
          return defaultValue || '';
        }),
      };

      const emptyUserService = new QiitaService(
        emptyConfigService as any,
        logger,
        cacheService,
      );

      const result = await emptyUserService.getUserArticles(10);

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'QIITA_USER_ID is not configured, returning empty list.',
      );
    });

    it('should use stale cache on API error', async () => {
      const staleArticles = [
        {
          id: 'stale1',
          title: 'Stale Article',
          url: 'https://qiita.com/testuser/items/stale1',
          likesCount: 5,
          stocksCount: 2,
          createdAt: '2025-01-01T00:00:00Z',
          tags: [],
        },
      ];

      cacheService.get.mockImplementation((key: string) => {
        if (key === 'qiita:articles:10') return null;
        if (key === 'qiita:articles:10:stale') return staleArticles;
        return null;
      });

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      const result = await service.getUserArticles(10);

      expect(result).toEqual(staleArticles);
      expect(logger.warn).toHaveBeenCalledWith(
        'Qiita API error, serving stale cache (1 items)',
      );

      fetchSpy.mockRestore();
    });

    it('should throw ServiceUnavailableException when no cache available', async () => {
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await expect(service.getUserArticles(10)).rejects.toThrow(
        ServiceUnavailableException,
      );

      fetchSpy.mockRestore();
    });

    it('should cap limit to 100', async () => {
      // キャッシュモックをクリア
      cacheService.get.mockClear();
      cacheService.set.mockClear();

      // キャッシュなし、API成功をモック
      cacheService.get.mockReturnValue(null);

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockArticles),
        headers: {
          get: (key: string) => {
            const headers: Record<string, string> = {
              'rate-limit': '1000',
              'rate-remaining': '999',
              'rate-reset': '1704067200',
            };
            return headers[key.toLowerCase()] || null;
          },
        },
      } as Response);

      await service.getUserArticles(1000);

      const fetchUrl = fetchSpy.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('per_page=100');
      expect(cacheService.set).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit info from cache', () => {
      const rateLimitInfo = {
        limit: 1000,
        remaining: 999,
        resetAt: 1704067200,
      };

      cacheService.get.mockReturnValue(rateLimitInfo);

      const result = service.getRateLimitInfo();

      expect(result).toEqual(rateLimitInfo);
      expect(cacheService.get).toHaveBeenCalledWith('qiita:rate-limit');
    });

    it('should return null when no rate limit info is cached', () => {
      cacheService.get.mockReturnValue(null);

      const result = service.getRateLimitInfo();

      expect(result).toBeNull();
    });
  });
});
