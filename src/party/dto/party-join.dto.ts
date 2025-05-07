import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PartyJoinDto {
  @ApiProperty({
    example: 1,
    description: 'room id',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    example: 1234,
    description: 'room password',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  password: number;
}
