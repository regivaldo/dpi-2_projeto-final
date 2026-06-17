import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
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

const COVER_UPLOAD_DIR = join(process.cwd(), 'uploads', 'talk-covers');
const ALLOWED_COVER_MIME_TYPES = ['image/png', 'image/jpeg'];
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;

interface UploadedCoverFile {
  filename: string;
}

mkdirSync(COVER_UPLOAD_DIR, { recursive: true });

const coverImageInterceptor = FileInterceptor('coverImage', {
  storage: diskStorage({
    destination: COVER_UPLOAD_DIR,
    filename: (_request, file, callback) => {
      const extension = file.mimetype === 'image/png' ? '.png' : '.jpg';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: MAX_COVER_SIZE_BYTES },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_COVER_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException('A capa deve ser uma imagem PNG ou JPG.'),
        false,
      );
      return;
    }

    callback(null, true);
  },
});

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
  @UseInterceptors(coverImageInterceptor)
  create(
    @Body() createTalkDto: CreateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() coverImage?: UploadedCoverFile,
  ) {
    return this.talksService.create(
      this.withCoverImageUrl(createTalkDto, coverImage),
      currentUser,
    );
  }

  @Patch(':id')
  @Roles(UserRole.Palestrante)
  @UseInterceptors(coverImageInterceptor)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTalkDto: UpdateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() coverImage?: UploadedCoverFile,
  ) {
    return this.talksService.update(
      id,
      this.withCoverImageUrl(updateTalkDto, coverImage),
      currentUser,
    );
  }

  @Put(':id')
  @Roles(UserRole.Palestrante)
  @UseInterceptors(coverImageInterceptor)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTalkDto: UpdateTalkDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() coverImage?: UploadedCoverFile,
  ) {
    return this.talksService.update(
      id,
      this.withCoverImageUrl(updateTalkDto, coverImage),
      currentUser,
    );
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

  private withCoverImageUrl<T extends CreateTalkDto | UpdateTalkDto>(
    dto: T,
    coverImage?: UploadedCoverFile,
  ): T & { coverImageUrl?: string } {
    if (!coverImage) {
      return dto;
    }

    return {
      ...dto,
      coverImageUrl: `/uploads/talk-covers/${coverImage.filename}`,
    };
  }
}
