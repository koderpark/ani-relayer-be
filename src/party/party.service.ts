import { Injectable } from '@nestjs/common';
import { RoomService } from 'src/room/room.service';
import { SocketService } from 'src/socket/socket.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PartyService {
  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  async createParty(key: UserKeyDto) {
}
