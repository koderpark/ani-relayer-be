import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { VidData } from '../entities/room.entity';

export class RoomUpdateDto {
  @IsOptional()
  @IsNumber()
  cntViewer?: number;

  @IsOptional()
  @IsString()
  vidTitle?: string;

  @IsOptional()
  @IsString()
  vidEpisode?: string;

  @IsOptional()
  @IsNumber()
  password?: number;

  @IsOptional()
  @IsObject()
  vidData?: VidData;
}
