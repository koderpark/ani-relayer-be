import { UserKeyDto } from 'src/user/dto/user-key.dto';

function parseKey(data: UserKeyDto): UserKeyDto {
  const { key, id, ...left } = data;
  return { key, id };
}

export { parseKey };
