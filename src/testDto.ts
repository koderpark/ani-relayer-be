import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TestDto {
  @ApiProperty({
    example: 'koderpark',
    description: "user's name",
    required: true,
  })
  @IsString()
  param1: string;

  @ApiProperty({
    example: 'koder0205@gmail.com',
    description: "user's email",
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  param2: string;
}
