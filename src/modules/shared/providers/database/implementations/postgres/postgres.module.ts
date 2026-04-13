import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ConfigModule } from '@app/config/config.module';

import { CONNECTIONS_NAMES } from '../../database.constant';
import { DATABASE_POSTGRES_SOURCE } from '../../database.token';

import PostgresDataSource from './postgres.database-connection';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: CONNECTIONS_NAMES.POSTGRES,
      imports: [ConfigModule],
      useFactory: async () => PostgresDataSource.options,
    }),
  ],
  providers: [
    {
      provide: DATABASE_POSTGRES_SOURCE,
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken(CONNECTIONS_NAMES.POSTGRES)],
    },
  ],
  exports: [DATABASE_POSTGRES_SOURCE, TypeOrmModule],
})
export class SharedProviderDatabaseImplementationsPostgresModule {}
