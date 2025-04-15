import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';

export class VideoParseDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsNotEmpty()
  speed: number;

  @IsNumber()
  @IsNotEmpty()
  time: number;

  @IsBoolean()
  @IsNotEmpty()
  isPaused: boolean;
}
