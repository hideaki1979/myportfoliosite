import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ContactFormDto } from './contact.dto';

/**
 * Resend APIのレスポンス型
 */
interface ResendResponse {
  id?: string;
  error?: {
    name: string;
    message: string;
  };
}

/**
 * メール送信サービス（Resend API統合）
 */
@Injectable()
export class MailService {
  private readonly resendApiKey: string;
  private readonly resendApiUrl = 'https://api.resend.com/emails';
  private readonly fromEmail: string;
  private readonly toEmail: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.resendApiKey = this.config.get<string>('RESEND_API_KEY', '');
    this.fromEmail = this.config.get<string>('RESEND_FROM', '');
    this.toEmail = this.config.get<string>('RESEND_TO', '');

    if (!this.resendApiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email sending will be disabled.',
      );
    }
  }

  /**
   * コンタクトフォームの内容をメール送信
   * @param formData - フォームデータ
   * @param metadata - メタデータ（IP, User-Agent等）
   */
  async sendControlEmail(
    formData: ContactFormDto,
    metadata: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ): Promise<void> {
    // Resend APIキーが未設定の場合はコンソールログのみ
    if (!this.resendApiKey) {
      this.logger.warn('RESEND_API_KEY not configured, logging to console');
      this.logContractFormSubmission(formData, metadata);
      return;
    }

    try {
      const htmlBody = this.buildEmailHtml(formData, metadata);
      const textBody = this.buildEmailText(formData, metadata);

      const emailPayload = {
        from: this.fromEmail,
        to: this.toEmail,
        subject: `[Contact Form] ${formData.subject}`,
        html: htmlBody,
        text: textBody,
        reply_to: formData.email,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

      const response = await fetch(this.resendApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = (await response.json()) as ResendResponse;

      if (!response.ok || data.error) {
        const errorMessage = data.error
          ? `${data.error.name}： ${data.error.message}`
          : `HTTP ${response.status}`;
        this.logger.error(`Resend API error: ${errorMessage}`);
        throw new Error(`Failed to send email: ${errorMessage}`);
      }

      this.logger.log(`Email sent successfully (ID: ${data.id})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send contact email: ${errorMessage}`);

      // メール送信失敗時もコンソールにログを残す
      this.logContractFormSubmission(formData, metadata);

      // メール送信失敗は致命的ではないため、例外を再スローしない
      // （フォーム送信自体は成功として扱う）
    }
  }

  /**
   * メール本文（HTML）を構築
   */
  private buildEmailHtml(
    formData: ContactFormDto,
    metadata?: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ): string {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Contact Form Submission</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 24px }
                    .header { background-color: #f4f4f4; padding: 12px; border-radius: 8px; }
                    .content { margin: 24px 0; }
                    .field { margin-bottom: 8px; }
                    .label { font-weight: bold; color: #555555 }
                    .value { margin-top: 8px; }
                    .metadata { margin-top: 32px; padding-top: 24px; border-top: 1px solid #dddddd; font-size: 1em; color: #666666 }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>新しいお問い合わせ</h2>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">件名：</div>
                            <div class="value">${this.escapeHtml(formData.subject)}</div>
                        </div>
                        <div class="field">
                            <div class="label">お名前：</div>
                            <div class="value">${this.escapeHtml(formData.name)}</div>
                        </div>
                        <div class="field">
                            <div class="label">メールアドレス：</div>
                            <div class="value">${this.escapeHtml(formData.email)}</div>
                        </div>
                        <div class="field">
                            <div class="label">メッセージ：</div>
                            <div class="value">${this.escapeHtml(formData.message)}</div>
                        </div>
                    </div>
                ${
                  metadata
                    ? `
                    <div class= "metadata">
                        <div><strong>メタデータ:</strong></div>
                        ${metadata.timestamp ? `<div>送信日時: ${this.escapeHtml(metadata.timestamp)}</div>` : ''}
                        ${metadata.ip ? `<div>IPアドレス: ${this.escapeHtml(metadata.ip)}</div>` : ''}
                        ${metadata.userAgent ? `<div>User-Agent: ${this.escapeHtml(metadata.userAgent)}</div>` : ''}
                        
                    </div>
                `
                    : ''
                }
                </div>
            </body>
            </html>
                `.trim();
  }

  /**
   * メール本文（プレーンテキスト）を構築
   */
  private buildEmailText(
    formData: ContactFormDto,
    metadata?: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ): string {
    let text = `
            新しいお問い合わせ

            件名： ${formData.subject}
            名前： ${formData.name}
            メールアドレス： ${formData.email}

            メッセージ：
            ${formData.message}
        `.trim();

    if (metadata) {
      text += '\n\n---\nメタデータ\n';
      if (metadata.timestamp) text += `送信日時: ${metadata.timestamp}\n`;
      if (metadata.ip) text += `IPアドレス: ${metadata.ip}\n`;
      if (metadata.userAgent) text += `User-Agent: ${metadata.userAgent}\n`;
    }

    return text;
  }

  /**
   * HTMLエスケープ処理
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }

  /**
   * コンソールにフォーム送信内容をログ出力
   */
  private logContractFormSubmission(
    formData: ContactFormDto,
    metadata?: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ): void {
    this.logger.log('Contact form submission:', {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      timestamp: metadata?.timestamp || new Date().toISOString(),
      ip: metadata?.ip || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }
}
