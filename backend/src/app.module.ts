import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TalksModule } from './talks/talks.module';
import { Talk } from './talks/talk.entity';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'ifsp-user-db',
      password: process.env.DB_PASSWORD ?? 'ifsp-palestra-@12',
      database: process.env.DB_DATABASE ?? 'ifsp-palestra',
      entities: [User, Talk],
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    }),
    UsersModule,
    AuthModule,
    TalksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
