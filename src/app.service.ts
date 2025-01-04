import { Injectable } from '@nestjs/common';
import { TestDto } from './testDto';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getTest(testDto: TestDto): string {
    return `${testDto.param1} user's email : ${testDto.param2}`;
  }

  getTest2(): string {
    return 'this is test2 endpoint';
  }
}
