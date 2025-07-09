import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  private logger: Logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(id: string, name: string): Promise<User> {
    const user = this.userRepository.create({ id, name }); // 엔티티 생성
    await this.userRepository.save(user); // 데이터베이스에 저장
    return user;
  }

  async read(id: string, relations: string[] = []): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations,
    });
    if (!user) throw new NotFoundException('user_not_found');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<boolean> {
    const res = await this.userRepository.update({ id }, data);
    return res.affected ? true : false;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.userRepository.delete({ id });
    return res.affected ? true : false;
  }
}
