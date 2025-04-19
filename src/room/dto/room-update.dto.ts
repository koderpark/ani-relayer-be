import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoomUpdateDto {
  @IsOptional()
  @IsNumber()
  cntViewer?: number;

  @IsOptional()
  @IsString()
  vidName?: string;

  @IsOptional()
  @IsString()
  vidUrl?: string;

  @IsOptional()
  @IsNumber()
  vidEpisode?: number;

  @IsOptional()
  @IsNumber()
  password?: number;
}
