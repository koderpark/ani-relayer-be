import { UserKeyDto } from 'src/user/dto/user-key.dto';

function parseKey(key: UserKeyDto): UserKeyDto {
  return { key: key.key, id: key.id };
}

export { parseKey };
