const DEVELOPMENT_SESSION_SECRET = 'development-only-session-secret-change-before-production';

function required(environment: Record<string, unknown>, name: string): string {
  const value = String(environment[name] ?? '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function validateEnvironment(environment: Record<string, unknown>) {
  required(environment, 'DATABASE_URL');

  if (environment.NODE_ENV === 'production') {
    const secret = required(environment, 'SESSION_SECRET');
    if (secret.length < 32 || secret.includes('change-me')) {
      throw new Error('SESSION_SECRET must be at least 32 characters and must not use a placeholder');
    }
    required(environment, 'APP_BASE_URL');
    required(environment, 'STORAGE_ENDPOINT');
    required(environment, 'STORAGE_BUCKET');
    required(environment, 'STORAGE_ACCESS_KEY');
    const storageSecret = required(environment, 'STORAGE_SECRET_KEY');
    if (storageSecret.includes('change-me')) {
      throw new Error('STORAGE_SECRET_KEY must not use a placeholder');
    }
  }

  return environment;
}

export function getSessionSecret(environment: { get<T = string>(name: string): T | undefined }): string {
  return environment.get<string>('SESSION_SECRET') || DEVELOPMENT_SESSION_SECRET;
}
