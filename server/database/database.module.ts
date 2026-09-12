import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { independentSchema } from './independent-schema';

export const INDEPENDENT_DATABASE = Symbol('INDEPENDENT_DATABASE');
export const DRIZZLE_DATABASE = INDEPENDENT_DATABASE;

export type IndependentDatabase = ReturnType<typeof createIndependentDatabase>;
export type PostgresJsDatabase = IndependentDatabase;

function createIndependentDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idle_timeout: Number(process.env.DB_IDLE_TIMEOUT_SECONDS ?? 20),
  });

  return drizzle(client, { schema: independentSchema });
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: INDEPENDENT_DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is required for the independent database');
        }
        return createIndependentDatabase(databaseUrl);
      },
    },
  ],
  exports: [INDEPENDENT_DATABASE],
})
export class DatabaseModule {}
