"use client"

import { forwardRef, InputHTMLAttributes } from "react";
import styled from "styled-components";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
`;

const Label = styled.label`
    font-size: 1rem;
    font-weight: 600;
    color: ${({theme}) => theme.colors.text.primary};

    &::after {
        content: "*";
        color: ${({theme}) => theme.colors.error};
    }
`;

const Input = styled.input<{ $hasError?: boolean }>`
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    color: ${({theme}) => theme.colors.text.primary};
    background-color: ${({theme}) => theme.colors.background.secondary};
    border: 2px solid
        ${({theme, $hasError}) => 
        $hasError ? theme.colors.error : theme.colors.border};
    border-radius: 0.5rem;
    transition: border-color 0.3s ease-in-out;

    &:hover:not(:disabled) {
        border-color: ${({theme, $hasError}) =>
        $hasError ? theme.colors.error : theme.colors.primary};
    }

    &:focus {
        outline: none;
        border-color: ${({theme, $hasError}) =>
            $hasError ? theme.colors.error : theme.colors.primary};
        box-shadow: 0 0 0 3px
        ${({theme, $hasError}) =>
        $hasError
            ? `${theme.colors.error}33`
            : `${theme.colors.primary}33`};
    }

    &:disabled {
        background-color: ${({theme}) => theme.colors.background.tertiary};
        cursor: not-allowed;
        opacity: 0.6;
    }

    &::placeholder {
        color: ${({theme}) => theme.colors.text.tertiary};
    }

    /* オートコレクトされたフィールドも定義済みスタイルに統一 */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px ${({theme}) => theme.colors.background.secondary} inset !important;
        -webkit-text-fill-color: ${({theme}) => theme.colors.text.primary} !important;
        box-shadow: 0 0 0 30px ${({theme}) => theme.colors.background.secondary} inset !important;
    }
`;

const ErrorMessage = styled.span`
    font-size: 0.85rem;
    color: ${({theme}) => theme.colors.error};
    display: flex;
    align-items: center;
    gap: 0.25rem;

    &::before {
        content: "⚠️";
    }
`;

const HelperText = styled.span`
    font-size: 0.75rem;
    color: ${({theme}) => theme.colors.text.tertiary};
`;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, helperText, id, ...props }, ref) => {
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

        return (
            <InputWrapper>
                <Label htmlFor={inputId}>{label}</Label>
                <Input
                    ref={ref}
                    id={inputId}
                    $hasError={!!error}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? errorId : helperText ? helperId : undefined
                    }
                    aria-required={true}
                    {...props}
                />
                {error && (
                    <ErrorMessage id={errorId} role="alert">
                        {error}
                    </ErrorMessage>
                )}
                {!error && helperText && <HelperText id={helperId}>{helperText}</HelperText>}
            </InputWrapper>
        );
    }
);

FormInput.displayName = "FormInput";

