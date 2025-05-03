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

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req, @Body() body: RoomCreateDto): Promise<RoomRespDto> {
    return await this.roomService.create(parseKey(req.user), body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/exit')
  async exit(@Req() req) {
    return await this.roomService.exit(parseKey(req.user));
  }

  @Get('list')
  async readAll() {
    return await this.roomService.readAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/join')
  async joinRoom(@Req() req, @Body() body: RoomJoinDto): Promise<RoomRespDto> {
    return await this.roomService.joinRoom(
      parseKey(req.user),
      body.roomId,
      body.password,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/my')
  async myRoom(@Req() req) {
    return await this.roomService.myRoom(parseKey(req.user));
  }

  @Get(':id')
  async read(@Param('id') id: number) {
    return await this.roomService.read(id);
  }

  @Get(':id/peers')
  async roomPeers(@Param('id') id: number) {
    return await this.roomService.roomPeers(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: RoomUpdateDto) {
    return this.roomService.update(+id, updateRoomDto);
  }
}
