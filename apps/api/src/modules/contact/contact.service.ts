import { Injectable } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service';
import { MailService } from './mail.service';
import { Logger } from 'nestjs-pino';
import { ContactFormDto, ContactResponseDto } from './contact.dto';

/**
 * Contact Service
 * コンタクトフォームのビジネスロジックを担当
 */
@Injectable()
export class ContactService {
  constructor(
    private readonly recaptchaService: RecaptchaService,
    private readonly mailService: MailService,
    private readonly logger: Logger,
  ) {}

  /**
   * コンタクトフォーム送信処理
   * @param formData - フォームデータ
   * @param recaptchaToken - reCAPTCHAトークン
   * @param metadata - リクエストメタデータ
   */
  async submitContactForm(
    formData: ContactFormDto,
    recaptchaToken: string,
    metadata?: {
      ip?: string;
      userAgent?: string;
    },
  ): Promise<ContactResponseDto> {
    try {
      // 1. reCAPTCHA検証
      await this.recaptchaService.verifyToken(recaptchaToken, metadata?.ip);

      // 2. メール送信
      await this.mailService.sendControlEmail(formData, {
        ...metadata,
        timestamp: new Date().toISOString(),
      });

      // 3. 成功レスポンス
      this.logger.log(
        `Contact form submitted successfully: ${formData.email} - ${formData.subject}`,
      );

      return {
        success: true,
        message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Contact form submission failed: ${errorMessage}`);

      // エラーはControllerで処理されるため、そのままスロー
      throw error;
    }
  }
}
