import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'koderpark',
    description: "user's name",
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'koder0205@gmail.com',
    description: "user's email",
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: "user's password",
    required: true,
  })
  @IsString()
  password: string;
}
