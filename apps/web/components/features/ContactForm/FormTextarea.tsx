"use client"

import { forwardRef, TextareaHTMLAttributes } from "react"
import styled from "styled-components";

interface FormTextAreaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    helperText?: string;
}

const TextareaWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
`;

const Label = styled.label`
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};

    &::after {
        content: "*";
        color: ${({ theme }) => theme.colors.error};
    }
`;

const Textarea = styled.textarea<{ $hasError?: boolean }>`
    width: 100%;
    min-height: 150px;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background.secondary};
    border: 2px solid
        ${({ theme, $hasError }) =>
        $hasError ? theme.colors.error : theme.colors.border};
    border-radius: 0.5rem;
    transition: border-color 0.3s ease-in-out;
    resize: vertical;
    font-family: inherit;

    &:hover:not(:disabled) {
        border-color: ${({ theme, $hasError }) =>
        $hasError ? theme.colors.error : theme.colors.primary};
    }

    &:focus:not(:disabled) {
        border-color: ${({ theme, $hasError }) =>
        $hasError ? theme.colors.error : theme.colors.primary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme, $hasError }) =>
        $hasError ? theme.colors.error : theme.colors.primary};
        box-shadow: 0 0 0 3px
        ${({ theme, $hasError }) =>
        $hasError
            ? `${theme.colors.error}33`
            : `${theme.colors.primary}33`};
    }

    &:disabled {
        background-color: ${({ theme }) => theme.colors.background.tertiary};
        cursor: not-allowed;
        opacity: 0.6;
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    /* オートコレクトされたフィールドも定義済みスタイルに統一 */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px ${({ theme }) => theme.colors.background.secondary} inset !important;
        -webkit-text-fill-color: ${({ theme }) => theme.colors.text.primary} !important;
        box-shadow: 0 0 0 30px ${({ theme }) => theme.colors.background.secondary} inset !important;
    }
`;

const ErrorMessage = styled.span`
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.error};
    display: flex;
    align-items: center;
    gap: 0.25rem;

    &::before {
        content: "⚠️";
    }
`;

const HelperText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
    ({ label, error, helperText, id, ...props }, ref) => {
        const textareaId =
            id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
        const errorId = `${textareaId}-error`;
        const helperId = `${textareaId}-helper`;

        return (
            <TextareaWrapper>
                <Label htmlFor={textareaId}>{label}</Label>
                <Textarea
                    ref={ref}
                    id={textareaId}
                    $hasError={!!error}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? errorId : helperText ? helperId : undefined
                    }
                    aria-required="true"
                    {...props}
                />
                {error && (
                    <ErrorMessage id={errorId} role="alert">
                        {error}
                    </ErrorMessage>
                )}
                {!error && helperText && <HelperText id={helperId}>{helperText}</HelperText>}
            </TextareaWrapper>
        );
    }
);

FormTextarea.displayName = "FormTextarea";

