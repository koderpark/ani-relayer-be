import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoomQueryDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsNumber()
  ownerId: number;

  @IsNotEmpty()
  @IsNumber()
  cntViewer?: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  vidName: string;

  @IsNotEmpty()
  @IsString()
  vidUrl: string;

  @IsNotEmpty()
  @IsNumber()
  vidEpisode: number;
}
