import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { PublicRoom } from '../interface';
import { Request } from 'express';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('public')
  async findAll(): Promise<PublicRoom[]> {
    return this.roomService.readAllPublic();
  }

  @Get(':uuid')
  async findByUuid(@Param('uuid') uuid: string): Promise<PublicRoom> {
    const room = await this.roomService.readByUuid(uuid, ['users', 'host']);
    return this.roomService.publicRoom(room);
  }
}
