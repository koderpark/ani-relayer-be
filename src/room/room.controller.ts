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
import { PublicRoom, RoomService } from './room.service';
import { Room } from './entities/room.entity';
import { Request } from 'express';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('public')
  async findAll(): Promise<PublicRoom[]> {
    return this.roomService.readAllPublic();
  }
}
