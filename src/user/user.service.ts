import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async findOne(data: LoginUserDto): Promise<User | null> {
    return await this.userRepository.findOneBy({ email: data.email });
  }

  async create(data: CreateUserDto): Promise<string> {
    const newUser = this.userRepository.create(data); // 엔티티 생성

    await this.makeHash(newUser);

    const val = await this.userRepository.save(newUser); // 데이터베이스에 저장
    return `${val.email} / ${val.id} / ${val.name} / ${val.password}`;
  }

  async makeHash(user: User): Promise<void> {
    user.password = await bcrypt.hash(user.password, 10);
    return Promise.resolve();
  }
}
