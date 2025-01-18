import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserQueryDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
}
