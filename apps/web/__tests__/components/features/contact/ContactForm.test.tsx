import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { theme } from "../../../../styles/theme";
import { ContactForm } from "../../../../components/features/ContactForm";

// ReCAPTCHAのモック
vi.mock("react-google-recaptcha", () => ({
    default: ({
        onChange,
    }: {
        onChange: (token: string | null) => void;
    }) => (
        <div data-testid="recaptcha-mock">
            <button
                type="button"
                onClick={() => onChange("mock-recaptcha-token")}
                data-testid="recaptcha-trigger"
            >
                reCAPTCHA
            </button>
        </div>
    ),
}));

const originalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

const renderContactForm = () =>
    render(
        <ThemeProvider theme={theme}>
            <ContactForm recaptchaSiteKey="test-site-key" />
        </ThemeProvider>
    );

const fillFormFields = () => {
    fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "山田 太郎" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "taro@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
        target: { value: "お問い合わせ件名" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
        target: { value: "お問い合わせ本文を入力しています。" },
    });
};

beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
});

describe("ContactForm", () => {
    it("フォームの初期構造を表示する", () => {
        renderContactForm();

        expect(
            screen.getByRole('heading', { name: /contact me/i })
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Subject")).toBeInTheDocument();
        expect(screen.getByLabelText("Message")).toBeInTheDocument();
        expect(screen.getByTestId("recaptcha-mock")).toBeInTheDocument();

        const submitButton = screen.getByRole("button", {
            name: "お問い合わせを送信",
        });
        expect(submitButton).toBeDisabled();
    });

    it("reCAPTCHA完了後に送信ボタンが有効化される", () => {
        renderContactForm();

        const submitButton = screen.getByRole("button", {
            name: "お問い合わせを送信",
        });

        fireEvent.click(screen.getByTestId("recaptcha-trigger"));

        expect(submitButton).toBeEnabled();
    });

    it("フォーム送信成功時に成功メッセージを表示する", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ message: "お問い合わせを受け付けました" }),
        });

        renderContactForm();
        fillFormFields();
        fireEvent.click(screen.getByTestId("recaptcha-trigger"));

        fireEvent.click(
            screen.getByRole("button", { name: "お問い合わせを送信" })
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        const callArgs = fetchMock.mock.calls.at(0);
        expect(callArgs).toBeDefined();

        const options = callArgs?.[1] as RequestInit | undefined;
        expect(options).toBeDefined();
        expect(options?.method).toBe("POST");
        expect(options?.headers).toMatchObject({
            "Content-Type": "application/json",
        });
        expect(JSON.parse(options?.body as string)).toEqual({
            name: "山田 太郎",
            email: "taro@example.com",
            subject: "お問い合わせ件名",
            message: "お問い合わせ本文を入力しています。",
            recaptchaToken: "mock-recaptcha-token",
        });

        expect(
            await screen.findByText("お問い合わせを受け付けました")
        ).toBeInTheDocument();
    });

    it("バリデーションエラー時にエラーメッセージを表示する", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            json: async () => ({ message: "送信に失敗しました。" }),
        });

        renderContactForm();
        fillFormFields();
        fireEvent.click(screen.getByTestId("recaptcha-trigger"));

        fireEvent.click(
            screen.getByRole("button", { name: "お問い合わせを送信" })
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        expect(
            await screen.findByText("送信に失敗しました。")
        ).toBeInTheDocument();
    });

    it("ネットワークエラー時にリトライ案内メッセージを表示する", async () => {
        fetchMock.mockRejectedValue(new Error("Network error"));

        renderContactForm();
        fillFormFields();
        fireEvent.click(screen.getByTestId("recaptcha-trigger"));

        fireEvent.click(
            screen.getByRole("button", { name: "お問い合わせを送信" })
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        expect(
            await screen.findByText(
                "ネットワークエラーが発生しました。しばらくしてからもう一度お試しください。",
            )
        ).toBeInTheDocument();
    })
})
