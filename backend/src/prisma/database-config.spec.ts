import { ConfigService } from '@nestjs/config';
import { getDatabaseUrl } from '../config/database-config';

describe('getDatabaseUrl', () => {
  it('uses a configured MySQL URL without modifying it', () => {
    const url = 'mysql://dbuser:dbpass@localhost:3306/horus';

    expect(getDatabaseUrl(new ConfigService({ DATABASE_URL: url }))).toBe(url);
  });

  it('encodes MySQL connection credentials and requires TLS when enabled', () => {
    const url = new URL(
      getDatabaseUrl(
        new ConfigService({
          DB_HOST: 'localhost',
          DB_PORT: '3307',
          DB_NAME: 'horus test',
          DB_USER: 'service@horus',
          DB_PASSWORD: 'secret:with/slash',
          DB_SSL: 'true',
        }),
      ),
    );

    expect(url.protocol).toBe('mysql:');
    expect(url.username).toBe('service%40horus');
    expect(url.password).toBe('secret%3Awith%2Fslash');
    expect(url.pathname).toBe('/horus%20test');
    expect(url.port).toBe('3307');
    expect(url.searchParams.get('sslaccept')).toBe('strict');
  });

  it('rejects non-MySQL and incomplete connection settings', () => {
    expect(() =>
      getDatabaseUrl(
        new ConfigService({ DATABASE_URL: 'postgresql://localhost/db' }),
      ),
    ).toThrow('DATABASE_URL debe apuntar a MySQL.');
    expect(() =>
      getDatabaseUrl(new ConfigService({ DB_HOST: 'localhost' })),
    ).toThrow('Configura DATABASE_URL o DB_HOST');
  });
});
