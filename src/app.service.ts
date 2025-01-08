import { Inject, Injectable } from '@nestjs/common';
import { TestDto } from './testDto';
import { User } from './db.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getTest(testDto: TestDto): string {
    return `${testDto.param1} user's email : ${testDto.param2}`;
  }

  getTest2(): string {
    return 'this is test2 endpoint';
  }

  async dbInsert(data: User): Promise<string> {
    const newUser = this.userRepository.create(data); // 엔티티 생성
    this.userRepository.save(newUser); // 데이터베이스에 저장
    return `${data.email} / ${data.id} / ${data.name} / ${data.password}`;
  }
}
