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
import { RoomCreateDto } from './dto/room-create.dto';
import { RoomJoinDto } from './dto/room-join.dto';
import { RoomRespDto } from './dto/room-resp.dto';
import { Room } from './entities/room.entity';
import { RoomVideoDto } from './dto/room-video.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req, @Body() body: RoomCreateDto): Promise<Room> {
    return await this.roomService.create(parseKey(req.user), body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/exit')
  async exit(@Req() req): Promise<boolean> {
    await this.roomService.exit(parseKey(req.user));
    return true;
  }

  @Get('list')
  async readAll(): Promise<Room[] | 'null'> {
    const res = await this.roomService.readAll();
    if (!res) return 'null';
    return res;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/join')
  async joinRoom(@Req() req, @Body() body: RoomJoinDto): Promise<Room> {
    return await this.roomService.joinRoom(
      parseKey(req.user),
      body.id,
      body.password,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/my')
  async myRoom(@Req() req): Promise<Room | 'null'> {
    const res = await this.roomService.readMine(parseKey(req.user));
    if (!res) return 'null';
    return res;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/peers')
  async roomPeers(
    @Req() req,
  ): Promise<
    { id: number; name: string; isOwner: boolean; isMe: boolean }[] | 'null'
  > {
    const res = await this.roomService.roomPeers(parseKey(req.user));
    if (!res) return 'null';
    return res;
  }

  @Get(':id')
  async read(@Param('id') id: number): Promise<Room | 'null'> {
    const res = await this.roomService.read(id);
    if (!res) return 'null';
    return res;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/updateVid')
  async updateVid(@Req() req, @Body() body: RoomVideoDto): Promise<boolean> {
    return await this.roomService.updateVideo(parseKey(req.user), body);
  }
}