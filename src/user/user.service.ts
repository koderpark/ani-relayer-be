import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserUpdateDto } from './dto/user-update.dto';

@Injectable()
export class UserService {
  private logger: Logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(socketId: string): Promise<User> {
    const user = this.userRepository.create({ socketId }); // 엔티티 생성
    await this.userRepository.save(user); // 데이터베이스에 저장
    return user;
  }

  async read(socketId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ socketId });
    if (!user) return await this.create(socketId);
    return user;
  }

  async update(socketId: string, data: UserUpdateDto): Promise<boolean> {
    const res = await this.userRepository.update({ socketId }, data);
    return res.affected ? true : false;
  }

  async remove(socketId: string): Promise<boolean> {
    const res = await this.userRepository.delete({ socketId });
    return res.affected ? true : false;
  }

  async listMember(roomId: number): Promise<User[]> {
    return await this.userRepository.findBy({ roomId });
  }

  async countMember(roomId: number): Promise<number> {
    const cnt = await this.userRepository.countBy({ roomId });
    return cnt;
  }
}
