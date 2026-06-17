import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateTalkDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'O horario deve estar no formato HH:mm ou HH:mm:ss.',
  })
  startTime?: string;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  folderUrl?: string | null;
}

export type UpdateTalkWithCoverDto = UpdateTalkDto & {
  coverImageUrl?: string | null;
};
