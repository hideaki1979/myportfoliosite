"use client"

import { useState } from "react";
import styled from "styled-components"
import { ContactFormData, contactFormSchema, SubmitStatus } from "./types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";
import { FormInput } from "./FormInput";
import { FormTextarea } from "./FormTextarea";

const FormContainer = styled.div`
    width: 100%;
    max-width: 768px;
    margin: 0 auto;
    padding: 2rem;
    background-color: ${({theme}) => theme.colors.background.secondary};
    border-radius: 0 4px 6px rgba(0, 0, 0, 0.1);

    @media (max-width: ${({theme}) => theme.breakpoints.tablet}) {
        padding: 1.5rem;
    }
`;

const FormTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    color: ${({theme}) => theme.colors.text.primary};
    text-align: center;
    margin-bottom: 2rem;

    @media (max-width: ${({theme}) => theme.breakpoints.tablet}px) {
        font-size: 1.75rem;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const RecaptchaWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 1rem 0;
`;

const SubmitButton = styled.button<{ $isLoading: boolean }>`
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    background-color: ${({ theme, $isLoading }) =>
    $isLoading ? theme.colors.text.tertiary : theme.colors.primary};
    border: none;
    border-radius: 0.5rem;
    cursor: ${({$isLoading}) => ($isLoading ? "not-allowed" : "pointer")};
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &:hover:not(:disabled) {
        background-color: ${({theme}) => theme.colors.primaryDark};
        transform: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &:focus {
        outline: none;
        box-shadow: 0 0 0 3px ${({theme}) => `${theme.colors.primary}33`};
    }
`;

const Spinner = styled.div`
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const StatusMessage = styled.div<{ $status: "success" | "error" }>`
    padding: 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-align: center;
    background-color: ${({theme, $status}) =>
        $status === "success"
            ? `${theme.colors.success}22`
            : `${theme.colors.error}22`};
    color: ${({theme, $status}) => 
        $status === "success" ? theme.colors.success : theme.colors.error};
    border: 1px solid
        ${({theme, $status}) => 
        $status === "success" ? theme.colors.success : theme.colors.error};
`;

interface ContactFormProps {
    recaptchaSiteKey: string;
}

export function ContactForm({ recaptchaSiteKey }: ContactFormProps) {
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
    const [statusMessage, setStatusMessage] = useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactFormSchema),
        mode: "onBlur",
    });

    const onRecaptchaChange = (token: string | null) => {
        setRecaptchaToken(token);
    };

    const onSubmit = async (data: ContactFormData) => {
        if (!recaptchaToken) {
            setSubmitStatus("error");
            setStatusMessage("reCAPTCHA認証を完了してください。");
            return;
        }

        setSubmitStatus("submitting");
        setStatusMessage("");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    recaptchaToken,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setSubmitStatus("success");
                setStatusMessage(
                    result.message || "お問い合わせを受け付けました。ご連絡ありがとうございます。"
                );
                reset();
                setRecaptchaToken(null);
            } else {
                setSubmitStatus("error");
                setStatusMessage(
                    result.message || "送信に失敗しました。もう一度お試しください。"
                );
            }
        } catch (error) {
            setSubmitStatus("error");
            setStatusMessage("ネットワークエラーが発生しました。しばらくしてからもう一度お試しください。");
            console.error("Contact form submission error:", error);
        }
    };

    const isFormDisabled = isSubmitting || submitStatus === 'submitting';

    return (
        <FormContainer>
            <FormTitle>Contact Me</FormTitle>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormInput
                    label="Name"
                    placeholder="山田 太郎"
                    error={errors.name?.message}
                    disabled={isFormDisabled}
                    {...register("name")}
                />

                <FormInput
                    label="Email"
                    type="email"
                    placeholder="example@email.com"
                    error={errors.email?.message}
                    disabled={isFormDisabled}
                    {...register("email")}
                />

                <FormInput
                    label="Subject"
                    placeholder="お問い合わせ件名"
                    error={errors.subject?.message}
                    disabled={isFormDisabled}
                    {...register("subject")}
                />

                <FormTextarea
                    label="Message"
                    placeholder="お問い合わせ内容をご記入ください"
                    error={errors.subject?.message}
                    disabled={isFormDisabled}
                    {...register("message")}
                />

                <RecaptchaWrapper>
                    <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={onRecaptchaChange} />
                </RecaptchaWrapper>

                {(submitStatus === "success" || submitStatus === "error") && (
                    <StatusMessage
                        $status={submitStatus}
                        role={submitStatus === "error" ? "alert" : "status"}
                        aria-live="polite"
                    >
                        {statusMessage}
                    </StatusMessage>
                )}
                <SubmitButton
                    type="submit"
                    disabled={!recaptchaToken || isFormDisabled}
                    $isLoading={isFormDisabled}
                    aria-label="お問い合わせを送信"
                >
                    {isFormDisabled ? (
                        <>
                            <Spinner />
                            送信中...
                        </>
                    ) : (
                        "送信"
                    )}
                </SubmitButton>
            </Form>
        </FormContainer>
    )
}

