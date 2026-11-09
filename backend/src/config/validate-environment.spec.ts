import { validateEnvironment } from './validate-environment';

describe('validateEnvironment', () => {
  const base = {
    DATABASE_URL: 'mysql://root:root@localhost:3306/horus',
    JWT_SECRET: 'a-test-secret-with-at-least-thirty-two-bytes',
  };

  it('accepts a development configuration, even with the root database user', () => {
    expect(() => validateEnvironment(base)).not.toThrow();
  });

  it('validates the sliding-session timings', () => {
    expect(() => validateEnvironment({ ...base, JWT_TTL: '30' })).toThrow(
      'JWT_TTL',
    );
    expect(() =>
      validateEnvironment({ ...base, JWT_TTL: '1800', SESSION_MAX_AGE: '900' }),
    ).toThrow('SESSION_MAX_AGE');
    expect(() =>
      validateEnvironment({
        ...base,
        JWT_TTL: '1800',
        SESSION_MAX_AGE: '28800',
      }),
    ).not.toThrow();
  });

  it('requires JWT_SECRET and ignores the legacy APP_KEY', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: base.DATABASE_URL,
        APP_KEY: base.JWT_SECRET,
      }),
    ).toThrow('JWT_SECRET');
  });

  it('rejects the root database user in production', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.test',
      }),
    ).toThrow('root');
  });

  it('requires explicit CORS origins in production', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        DATABASE_URL: 'mysql://horus_app:secret@localhost:3306/horus',
        NODE_ENV: 'production',
      }),
    ).toThrow('CORS_ORIGINS');
  });

  it('accepts a least-privilege production configuration', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        DATABASE_URL: 'mysql://horus_app:secret@localhost:3306/horus',
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example.test',
      }),
    ).not.toThrow();
  });
});
