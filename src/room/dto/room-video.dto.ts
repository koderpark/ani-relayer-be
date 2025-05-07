import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoomVideoDto {
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
