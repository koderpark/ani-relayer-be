import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Room } from './entities/room.entity';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/my')
  async myRoom(@Req() req): Promise<Room | 'null'> {
    const res = await this.roomService.readMine(req.user.socketId);
    if (!res) return 'null';
    return res;
  }

  @Get('removeAll')
  async removeAll(): Promise<boolean> {
    const res = await this.roomService.removeAll();
    if (!res) return false;
    return true;
  }

  @Get(':id')
  async read(@Param('id') id: number): Promise<Room | 'null'> {
    const res = await this.roomService.read(id);
    if (!res) return 'null';
    return res;
  }
}