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

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req, @Body() body: RoomCreateDto): Promise<RoomQueryDto> {
    return await this.roomService.create(parseKey(req.user), body);
  }

  @Get(':id')
  async read(@Param('id') id: number) {
    return await this.roomService.read(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: RoomUpdateDto) {
    return this.roomService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomService.remove(+id);
  }

  @Get('list')
  async readAll() {
    return await this.roomService.readAll();
  }
}
