import { z } from "zod";

/**
 * コンタクトフォームのバリデーションスキーマ
 */
export const contactFormSchema = z.object({
    name: z
        .string()
        .min(1, "名前は必須です")
        .min(2, "名前は2文字以上入力してください")
        .max(20, "名前は20文字以内で入力してください"),
    email: z
        .string()
        .min(1, "メールは必須です")
        .pipe(z.email({ message: "正しいメール形式で入力してください" })),
    subject: z
        .string()
        .min(1, "件名は必須です")
        .min(5, "件名は5文字以上で入力してください")
        .max(50, "件名は50文字以内で入力してください"),
    message: z
        .string()
        .min(1, "メッセージは必須です")
        .min(10, "メッセージは10文字以上で入力してください")
        .max(500, "メッセージは500文字以内で入力してください"),
});

/**
 * コンタクトフォームのデータ型
 */
export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * APIリクエストの型（reCAPTCHAトークン含む）
 */
export interface ContactFormRequest extends ContactFormData {
    recaptchaToken: string;
}

/**
 * APIレスポンスの型
 */
export interface ContactFormResponse {
    success: boolean;
    message: string;
}

/**
 * フォーム送信の状態
 */
export type SubmitStatus = "idle" | "submitting" | "success" | "error";
