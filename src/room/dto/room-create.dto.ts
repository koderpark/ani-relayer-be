import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RoomCreateDto {
  @ApiProperty({
    example: '야메나 사이! :tomato:',
    description: "displayed room's name",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  roomName: string;
}
