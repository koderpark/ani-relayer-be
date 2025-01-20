import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserMaskedDto {
  @IsNumber()
  @IsNotEmpty()
  key: number;

  @IsString()
  @IsNotEmpty()
  id: string;
}
