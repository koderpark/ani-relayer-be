import { Controller, Post, Req, Body, UseGuards, Get } from '@nestjs/common';
import { RoomJoinDto } from 'src/room/dto/room-join.dto';
import { PartyService } from './party.service';
import { parseKey } from 'src/utils/parse';
import { Room } from 'src/room/entities/room.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/join')
  async joinRoom(@Req() req, @Body() body: RoomJoinDto): Promise<Room> {
    return await this.partyService.join(
      parseKey(req.user),
      body.id,
      body.password,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/exit')
  async exit(@Req() req): Promise<boolean> {
    await this.partyService.exit(parseKey(req.user));
    return true;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/peers')
  async peers(
    @Req() req,
  ): Promise<
    { id: number; name: string; isOwner: boolean; isMe: boolean }[] | 'null'
  > {
    const res = await this.partyService.peers(parseKey(req.user));
    if (!res) return 'null';
    return res;
  }
}
