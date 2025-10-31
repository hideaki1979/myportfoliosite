import z from "zod";
import { contactFormSchema } from "../../../components/features/ContactForm";
import { NextRequest, NextResponse } from "next/server";

/**
 * reCAPTCHAトークン検証用のスキーマ
 */
const contactRequestSchema = contactFormSchema.extend({
    recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
});

/**
 * reCAPTCHA検証レスポンス型
 */
interface RecaptchaVerifyResponse {
    success: boolean;
    challenge_ts: string;
    hostname?: string;
    "error-codes"?: string[];
}

/**
 * reCAPTCHAトークンを検証
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY is not configured");
        return false;
    }

    try {
        const response = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${secretKey}&response=${token}`,
            }
        );

        const data: RecaptchaVerifyResponse = await response.json();

        if (!data.success) {
            console.error("reCAPTCHA verification failed:", data["error-codes"]);
        }

        return data.success;
    } catch (error) {
        console.error("reCAPTCHA verification error:", error);
        return false;
    }
}

/**
 * コンタクトフォーム送信API
 * POST /api/contact
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // バリデーション
        const validationResult = contactRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "入力内容に誤りがあります。",
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { name, email, subject, message, recaptchaToken } =
            validationResult.data;

        // reCAPTCHA検証
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);

        if (!isRecaptchaValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "reCAPTCHA認証に失敗しました。もう一度お試しください。",
                },
                { status: 400 }
            );
        }

        // TODO: Resend APIを使用したメール送信
        // 現在はコンソールにログ出力のみ
        console.log("Contact form submission:", {
            name,
            email,
            subject,
            message,
            timestamp: new Date().toISOString(),
            ip: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
        });

        // 成功レスポンス
        return NextResponse.json(
            {
                success: true,
                message: "お問い合わせを受け付けました。ご連絡ありがとうございます。",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Contact form API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "サーバーエラーが発生しました。しばらくしてからもう一度お試しください。",
            },
            { status: 500 }
        );
    }
}

/**
 * OPTIONS リクエストハンドラー（CORSプリフライト対応）
 */
export async function OPTIONS() {
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: {
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        }
    );
}
