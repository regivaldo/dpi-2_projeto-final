import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Talk } from './talk.entity';
import { TalksController } from './talks.controller';
import { TalksService } from './talks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Talk]), UsersModule],
  controllers: [TalksController],
  providers: [TalksService],
})
export class TalksModule {}
