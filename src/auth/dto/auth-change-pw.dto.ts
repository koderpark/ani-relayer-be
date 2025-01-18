import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthChangePWDto {
  @ApiProperty({
    example: 'P@ssw0rd',
    description: "user's current password",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: "user's new password",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
