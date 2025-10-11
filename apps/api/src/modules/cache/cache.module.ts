import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * グローバルキャッシュモジュール
 * アプリケーション全体でCacheServiceを使用可能にする
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
