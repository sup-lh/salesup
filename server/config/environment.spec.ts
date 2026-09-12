import { getSessionSecret, validateEnvironment } from './environment';

describe('environment validation', () => {
  it('requires a strong production session secret', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgres://db' })).toThrow('SESSION_SECRET');
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://db',
      SESSION_SECRET: 'x'.repeat(32),
      APP_BASE_URL: 'https://example.test',
      STORAGE_ENDPOINT: 'https://storage.example.test',
      STORAGE_BUCKET: 'app',
      STORAGE_ACCESS_KEY: 'access',
      STORAGE_SECRET_KEY: 'secret',
    })).not.toThrow();
  });

  it('provides a development-only fallback secret', () => {
    expect(getSessionSecret({ get: () => undefined })).toContain('development-only');
  });
});
