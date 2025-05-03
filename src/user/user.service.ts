import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserMaskedDto } from './dto/user-masked.dto';
import { UserKeyDto } from './dto/user-key.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserCreateDto } from './dto/user-create.dto';

@Injectable()
export class UserService {
  private logger: Logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: UserCreateDto): Promise<boolean> {
    const user = this.userRepository.create(data); // 엔티티 생성
    await this.userRepository.save(user); // 데이터베이스에 저장
    return true;
  }

  async read(key: UserKeyDto): Promise<UserMaskedDto | null> {
    const user = await this.userRepository.findOneBy(key);
    if (!user) return null;

    const { password, ...left } = user;
    return left;
  }

  async readWithPW(data: UserKeyDto): Promise<User | null> {
    return await this.userRepository.findOneBy(data);
  }

  async update(key: UserKeyDto, data: UserUpdateDto) {
    const res = await this.userRepository.update(key, data);
    return res.affected ? true : false;
  }

  async remove() {}

  async chkId(loginId: string): Promise<boolean> {
    const cnt = await this.userRepository.countBy({ loginId });
    if (cnt == 0) return true;
    return false;
  }

  async roomMembers(roomId: number): Promise<{ id: number; name: string }[]> {
    const userList = await this.userRepository.findBy({ roomId });
    const peers = userList.map((user) => {
      return {
        id: user.userId,
        name: user.loginId,
      };
    });
    return peers;
  }
}
