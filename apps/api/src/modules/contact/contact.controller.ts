import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';
import { contactRequestSchema, ContactResponseDto } from './contact.dto';
import { z } from 'zod';

/**
 * Contact Controller
 * コンタクトフォームAPIのエンドポイント
 */
@Controller('api/contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly logger: Logger,
  ) {}

  /**
   * コンタクトフォーム送信
   * POST /api/contact
   */
  @Post()
  async submitContactForm(
    @Body() body: unknown,
    @Req() request: Request,
  ): Promise<ContactResponseDto> {
    // バリデーション
    const validationResult = contactRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;
      this.logger.warn('Contact form validation failed', { errors });

      return {
        success: false,
        message: '入力内容に誤りがあります。',
        errors,
      };
    }

    const { recaptchaToken, ...formData } = validationResult.data;

    // リクエストメタデータ取得
    const metadata = {
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'] || 'unknown',
    };

    try {
      // サービス層で処理
      return await this.contactService.submitContactForm(
        formData,
        recaptchaToken,
        metadata,
      );
    } catch (error) {
      // BadRequestExceptionはそのまま返す（reCAPTCHA検証エラー等）
      if (error instanceof BadRequestException) {
        throw new BadRequestException({
          success: false,
          message:
            error.message ||
            'reCAPTCHA認証に失敗しました。もう一度お試しください。',
        });
      }

      // その他のエラーは500エラー
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Contact form API error: ${errorMessage}`);

      throw new InternalServerErrorException({
        success: false,
        message:
          'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。',
      });
    }
  }

  /**
   * クライアントのIPアドレスを取得
   */
  private getClientIp(request: Request): string {
    // X-Forwarded-For, X-Real-IP, またはリモートアドレスから取得
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }
    return request.socket.remoteAddress || 'unknown';
  }
}
