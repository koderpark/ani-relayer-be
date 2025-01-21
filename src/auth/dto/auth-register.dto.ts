import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthRegisterDto {
  @ApiProperty({
    example: 'koderpark',
    description: "user's nickname (for login)",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: "user's password",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
