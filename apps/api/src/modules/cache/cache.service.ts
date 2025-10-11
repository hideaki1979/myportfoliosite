import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * メモリベースのシンプルなキャッシュサービス
 * 本番環境ではRedis等の外部キャッシュへの移行を推奨
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cleanupInterval = 60_000; // 1分ごとにクリーンアップ
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private readonly logger: Logger) {
    // 定期的に期限切れエントリを削除
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * モジュール破棄時にクリーンアップタイマーを停止
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.debug('Cache cleanup timer stopped');
    }
  }

  /**
   * キャッシュにデータを保存
   * @param key キャッシュキー
   * @param value 保存する値
   * @param ttlSeconds TTL（秒）
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      data: value,
      expiresAt,
    });
    this.logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされたデータ（存在しないか期限切れの場合はnull）
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * キャッシュからデータを削除
   * @param key キャッシュキー
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted: ${key}`);
  }

  /**
   * すべてのキャッシュをクリア
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache cleared: ${size} entries removed`);
  }

  /**
   * キャッシュのサイズを取得
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(
        `Cache cleanup: ${removedCount} expired entries removed`,
      );
    }
  }
}
