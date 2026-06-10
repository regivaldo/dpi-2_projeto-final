import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateTalkDto } from './dto/create-talk.dto';
import { ListTalksQueryDto } from './dto/list-talks-query.dto';
import { UpdateTalkDto } from './dto/update-talk.dto';
import { TalksService } from './talks.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('talks')
export class TalksController {
  constructor(private readonly talksService: TalksService) {}

  @Get()
  findAll(@Query() query: ListTalksQueryDto) {
    return this.talksService.findAll(query);
  }

  @Get('mine')
  @Roles(UserRole.Palestrante)
  findMine(
    @Query() query: ListTalksQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.findMine(query, currentUser);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.talksService.findOne(id);
  }

  @Post()
  @Roles(UserRole.Palestrante)
  create(
    @Body() createTalkDto: CreateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.create(createTalkDto, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.Palestrante)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTalkDto: UpdateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.update(id, updateTalkDto, currentUser);
  }

  @Put(':id')
  @Roles(UserRole.Palestrante)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTalkDto: UpdateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.update(id, updateTalkDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.Palestrante)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.remove(id, currentUser);
  }

  @Post(':id/enrollments')
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.enroll(id, currentUser);
  }

  @Delete(':id/enrollments/me')
  cancelEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.cancelEnrollment(id, currentUser);
  }

  @Delete(':id/enrollments/:userId')
  @Roles(UserRole.Palestrante)
  removeAttendee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.talksService.removeAttendee(id, userId, currentUser);
  }
}
