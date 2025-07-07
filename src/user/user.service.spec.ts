import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { mockUser, User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findBy: jest.fn(),
            countBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const user = mockUser;
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      const result = await service.create('socket-123');
      expect(repo.create).toHaveBeenCalledWith({ socketId: 'socket-123' });
      expect(repo.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('read', () => {
    it('should return user if found', async () => {
      const user = mockUser;
      repo.findOneBy.mockResolvedValue(user);
      const result = await service.read('socket-123');
      expect(repo.findOneBy).toHaveBeenCalledWith({ socketId: 'socket-123' });
      expect(result).toBe(user);
    });
    it('should create user if not found', async () => {
      const user = mockUser;
      repo.findOneBy.mockResolvedValue(undefined);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      const result = await service.read('socket-123');
      expect(repo.create).toHaveBeenCalledWith({ socketId: 'socket-123' });
      expect(repo.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    it('should return true if update affected rows', async () => {
      repo.update.mockResolvedValue({ affected: 1 } as any);
      const result = await service.update('socket-123', {
        room: { id: 2 } as any,
      });
      expect(repo.update).toHaveBeenCalledWith(
        { socketId: 'socket-123' },
        { room: { id: 2 } },
      );
      expect(result).toBe(true);
    });
    it('should return false if update affected 0 rows', async () => {
      repo.update.mockResolvedValue({ affected: 0 } as any);
      const result = await service.update('socket-123', {
        room: { id: 2 } as any,
      });
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should return true if delete affected rows', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.remove('socket-123');
      expect(repo.delete).toHaveBeenCalledWith({ socketId: 'socket-123' });
      expect(result).toBe(true);
    });
    it('should return false if delete affected 0 rows', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as any);
      const result = await service.remove('socket-123');
      expect(result).toBe(false);
    });
  });

  describe('listMember', () => {
    it('should return users by room id', async () => {
      const users = [mockUser, mockUser];
      repo.findBy.mockResolvedValue(users);
      const result = await service.listMember(1);
      expect(repo.findBy).toHaveBeenCalledWith({ room: { id: 1 } });
      expect(result).toBe(users);
    });
  });

  describe('countMember', () => {
    it('should return count of users by room id', async () => {
      repo.countBy.mockResolvedValue(3);
      const result = await service.countMember(1);
      expect(repo.countBy).toHaveBeenCalledWith({ room: { id: 1 } });
      expect(result).toBe(3);
    });
  });
});
