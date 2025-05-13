import { Exclude, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { RoomPeerDto } from './room-peer.dto';

export class RoomStatusDto {
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

  @IsNotEmpty()
  @IsArray()
  @Type(() => RoomPeerDto)
  peers: RoomPeerDto[];
}
