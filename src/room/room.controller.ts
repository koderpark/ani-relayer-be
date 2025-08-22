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
}
