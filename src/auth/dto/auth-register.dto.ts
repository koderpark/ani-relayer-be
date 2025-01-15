import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthRegisterDto {
  @ApiProperty({
    example: '박성훈',
    description: "user's name",
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'test@koder.page',
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
