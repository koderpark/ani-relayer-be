import { UserKeyDto } from 'src/user/dto/user-key.dto';

function parseKey(data: UserKeyDto): UserKeyDto {
  const { userId, loginId, ...left } = data;
  return { userId, loginId };
}

export { parseKey };
