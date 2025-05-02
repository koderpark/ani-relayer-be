import { Exclude } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class RoomRespDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsNumber()
  cntViewer: number;

  @IsNotEmpty()
  @IsBoolean()
  isOwner: boolean;

  @IsNotEmpty()
  @IsString()
  name: string;
}
