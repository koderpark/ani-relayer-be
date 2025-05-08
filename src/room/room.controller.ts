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
import { RoomUpdateDto } from './dto/room-update.dto';
import { parseKey } from 'src/utils/parse';
import { RoomQueryDto } from './dto/room-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoomRespDto } from './dto/room-resp.dto';
import { Room } from './entities/room.entity';
import { RoomVideoDto } from './dto/room-video.dto';

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

  @Get(':id')
  async read(@Param('id') id: number): Promise<Room | 'null'> {
    const res = await this.roomService.read(id);
    if (!res) return 'null';
    return res;
  }
}