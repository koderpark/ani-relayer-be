import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RoomCreateDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  ownerId: number;

  @IsNotEmpty()
  @IsNumber()
  code: number;
}
