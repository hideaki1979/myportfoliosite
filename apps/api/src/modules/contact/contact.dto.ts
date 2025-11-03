import { z } from 'zod';

/**
 * コンタクトフォームのバリデーションスキーマ
 * フロントエンドと同一のルールを適用
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, '名前は2文字以上入力してください')
    .max(20, '名前は20文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールは必須です')
    .email('正しいメール形式で入力してください'),
  subject: z
    .string()
    .min(5, '件名は5文字以上で入力してください')
    .max(50, '件名は50文字以内で入力してください'),
  message: z
    .string()
    .min(10, 'メッセージは10文字以上で入力してください')
    .max(500, 'メッセージは500文字以内で入力してください'),
});

/**
 * reCAPTCHAトークンを含むリクエストスキーマ
 */
export const contactRequestSchema = contactFormSchema.extend({
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
});

/**
 * コンタクトフォームデータの型
 */
export type ContactFormDto = z.infer<typeof contactFormSchema>;

/**
 * reCAPTCHAトークンを含むリクエストの型
 */
export type ContactRequestDto = z.infer<typeof contactRequestSchema>;

/**
 * APIレスポンスの型
 */
export interface ContactResponseDto {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}
