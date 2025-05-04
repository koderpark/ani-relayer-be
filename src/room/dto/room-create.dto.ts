import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RoomCreateDto {
  @ApiProperty({
    example: '야메나 사이! :tomato:',
    description: "displayed room's name",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 1234,
    description: 'room password',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  password: number;
}
