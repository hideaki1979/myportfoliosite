import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

/**
 * reCAPTCHA検証レスポンスの型
 */
interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * reCAPTCHA検証サービス
 */
@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly verifyUrl =
    'https://www.google.com/recaptcha/api/siteverify';

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.secretKey = this.config.get<string>('RECAPTCHA_SECRET_KEY', '');

    if (!this.secretKey) {
      this.logger.warn(
        'RECAPTCHA_SECRET_KEY is not configured. reCAPTCHA verification will fail.',
      );
    }
  }

  /**
   * reCAPTCHAトークンを検証
   * @param token - reCAPTCHAトークン
   * @param remoteIp - クライアントのIPアドレス（オプション）
   * @returns 検証成功時はtrue、失敗時はfalseまたは例外をスロー
   */
  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    if (!this.secretKey) {
      this.logger.error('RECAPTCHA_SECRET_KEY is not configured');
      throw new InternalServerErrorException(
        'reCAPTCHA認証が正しく設定されていません',
      );
    }

    if (!token || token.trim() === '') {
      this.logger.warn('reCAPTCHA token is empty');
      throw new BadRequestException('reCAPTCHAトークンが無効です');
    }

    try {
      // URLエンコードされたフォームデータとして送信
      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', token);
      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.error(
          `reCAPTCHA API returned non-OK status: ${response.status}`,
        );
        throw new ServiceUnavailableException(
          'reCAPTCHA検証サーバーに接続できません',
        );
      }

      const data = (await response.json()) as RecaptchaVerifyResponse;

      if (!data.success) {
        const errorCodes = data['error-codes'] || [];
        this.logger.warn(
          `reCAPTCHA verification failed: ${errorCodes.join(', ')}`,
        );

        // エラーコードに応じたメッセージ
        if (errorCodes.includes('timeout-or-duplicate')) {
          throw new BadRequestException(
            'reCAPTCHAトークンの有効期限が切れています。ページを再読み込みしてください。',
          );
        }

        if (errorCodes.includes('invalid-input-response')) {
          throw new BadRequestException('reCAPTCHAトークンが無効です');
        }

        throw new BadRequestException(
          'reCAPTCHA認証に失敗しました。もう一度お試しください。',
        );
      }

      this.logger.log('reCAPTCHA verification successful');
      return true;
    } catch (error) {
      // すでにBadRequestExceptionの場合はそのままスロー
      if (error instanceof BadRequestException) {
        throw error;
      }

      // タイムアウトやネットワークエラー
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('reCAPTCHA verification timeout');
        throw new ServiceUnavailableException(
          'reCAPTCHA検証がタイムアウトしました。もう一度お試しください。',
        );
      }

      // その他のエラー
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`reCAPTCHA verification error: ${errorMessage}`);
      throw new ServiceUnavailableException(
        'reCAPTCHA検証中にエラーが発生しました',
      );
    }
  }
}
