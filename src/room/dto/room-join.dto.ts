import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoomJoinDto {
  @ApiProperty({
    example: 1,
    description: 'room id',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @ApiProperty({
    example: 1234,
    description: 'room password',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  password: number;
}
