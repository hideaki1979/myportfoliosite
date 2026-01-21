import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as fs from 'fs';
import * as path from 'path';
import { AIArticlesStorage } from '../dto/ai-article.dto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'ai-articles.json');

/**
 * AI記事のJSONファイルストレージサービス
 */
@Injectable()
export class FileStorageService implements OnModuleInit {
  constructor(private readonly logger: Logger) {}

  /**
   * モジュール初期化時にデータディレクトリを作成
   */
  onModuleInit(): void {
    this.ensureDataDirectory();
  }

  /**
   * データディレクトリの存在確認・作成
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      this.logger.log(`Created data directory: ${DATA_DIR}`);
    }
  }

  /**
   * 記事データを読み込む
   */
  read(): AIArticlesStorage | null {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        this.logger.debug('AI articles data file does not exist');
        return null;
      }

      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content) as AIArticlesStorage;

      this.logger.debug(`Read ${data.articles.length} AI articles from file`);
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read AI articles data: ${errorMessage}`);
      return null;
    }
  }

  /**
   * 記事データを保存する
   */
  write(data: AIArticlesStorage): boolean {
    try {
      this.ensureDataDirectory();

      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(DATA_FILE, content, 'utf-8');

      this.logger.log(`Saved ${data.articles.length} AI articles to file`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write AI articles data: ${errorMessage}`);
      return false;
    }
  }

  /**
   * データファイルが存在するか確認
   */
  exists(): boolean {
    return fs.existsSync(DATA_FILE);
  }

  /**
   * データファイルの最終更新日時を取得
   */
  getLastModified(): Date | null {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return null;
      }

      const stats = fs.statSync(DATA_FILE);
      return stats.mtime;
    } catch {
      return null;
    }
  }
}
