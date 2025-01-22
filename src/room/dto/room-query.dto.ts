import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RoomQueryDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  ownerId: number;

  @IsNotEmpty()
  @IsNumber()
  code: number;

  @IsNotEmpty()
  @IsNumber()
  cntViewer?: number;

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
