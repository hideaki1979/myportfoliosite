import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const API_KEY_ENV_VAR_METADATA = 'apiKeyEnvVar';

export type ApiKeyMetadata = {
  envVar: string;
  missingMessage?: string;
  invalidMessage?: string;
};

export type ApiKeyOptions = {
  missingMessage?: string;
  invalidMessage?: string;
};

export const ApiKeyProtected = (
  envVar: string,
  options?: ApiKeyOptions | string,
): CustomDecorator<string> => {
  const metadata: ApiKeyMetadata =
    typeof options === 'string'
      ? { envVar, missingMessage: options }
      : { envVar, ...options };

  return SetMetadata(API_KEY_ENV_VAR_METADATA, metadata);
};
