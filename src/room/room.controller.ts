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
import { parseKey } from 'src/utils/parse';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Room } from './entities/room.entity';
import { RoomStatusDto } from './dto/room-status.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('list')
  async readAll(): Promise<Room[] | 'null'> {
    const res = await this.roomService.readAll();
    if (!res) return 'null';
    return res;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/my')
  async myRoom(@Req() req): Promise<Room | 'null'> {
    const res = await this.roomService.readMine(parseKey(req.user));
    if (!res) return 'null';
    return res;
  }

  @Get('removeAll')
  async removeAll(): Promise<boolean> {
    const res = await this.roomService.removeAll();
    if (!res) return false;
    return true;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async status(@Req() req): Promise<RoomStatusDto> {
    const res = await this.roomService.roomStatus(parseKey(req.user));
    if (!res) return null;
    return res;
  }

  @Get(':id')
  async read(@Param('id') id: number): Promise<Room | 'null'> {
    const res = await this.roomService.read(id);
    if (!res) return 'null';
    return res;
  }
}