import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from 'src/auth/dto/auth-register.dto';
import { AuthLoginDto } from 'src/auth/dto/auth-login.dto';
import { UserMaskedDto } from './dto/user-masked.dto';
import { UserKeyDto } from './dto/user-key.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: AuthRegisterDto): Promise<boolean> {
    const user = this.userRepository.create(data); // 엔티티 생성
    user.password = await bcrypt.hash(user.password, 10);

    const val = await this.userRepository.save(user); // 데이터베이스에 저장
    return true;
  }

  async read(data: UserKeyDto): Promise<UserMaskedDto | null> {
    const user = await this.userRepository.findOneBy(data);
    if (!user) return null;

    const { password, ...left } = user;
    return left;
  }

  async update() {}
  async remove() {}

  async emailCheck(email: string): Promise<boolean> {
    const count = await this.userRepository.countBy({ email });
    if (count == 0) return true;
    return false;
  }

  async attemptLogin(data: AuthLoginDto): Promise<UserKeyDto | null> {
    const user = await this.userRepository.findOneBy({ email: data.email });
    if (!user) return null;

    const comp = await bcrypt.compare(data.password, user.password);
    if (comp) {
      const { id, ...rest } = user;
      return { id };
    } else return null;
  }
}
