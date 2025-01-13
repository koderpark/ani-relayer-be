import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(data: LoginUserDto): Promise<any> {
    const find = await this.userRepository.findOneBy({ email: data.email });
    if (find.password === data.password) {
      const payload = { sub: find.id, username: find.name };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } else throw new UnauthorizedException();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async create(data: CreateUserDto): Promise<string> {
    const newUser = this.userRepository.create(data); // 엔티티 생성
    const val = await this.userRepository.save(newUser); // 데이터베이스에 저장
    return `${val.email} / ${val.id} / ${val.name} / ${val.password}`;
  }
}
