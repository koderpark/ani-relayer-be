import { Controller, Post, Req, Body, UseGuards, Get } from '@nestjs/common';
import { PartyJoinDto } from 'src/party/dto/party-join.dto';
import { PartyService } from './party.service';
import { Room } from 'src/room/entities/room.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PartyCreateDto } from './dto/party-create.dto';
import { RoomService } from 'src/room/room.service';

@Controller('party')
export class PartyController {
  constructor(
    private readonly partyService: PartyService,
    private readonly roomService: RoomService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/create')
  async create(@Req() req, @Body() body: PartyCreateDto): Promise<Room> {
    return await this.partyService.create(parseKey(req.user), body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/join')
  async join(@Req() req, @Body() body: PartyJoinDto): Promise<Room> {
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
    const res = await this.roomService.peers(parseKey(req.user));
    if (!res) return 'null';
    return res;
  }
}
