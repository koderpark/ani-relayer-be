import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { mockUser, User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      const result = await service.create('socket-123');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        socketId: 'socket-123',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('read', () => {
    it('should return user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.read('socket-123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { socketId: 'socket-123' },
        relations: [],
      });
      expect(result).toBe(mockUser);
    });

    it('should create user if not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      const result = await service.read('socket-123');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        socketId: 'socket-123',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should return user with relations if specified', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.read('socket-123', ['room', 'host']);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { socketId: 'socket-123' },
        relations: ['room', 'host'],
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('update', () => {
    it('should return true if update affected rows', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);
      const result = await service.update('socket-123', {
        room: { id: 2 } as any,
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { socketId: 'socket-123' },
        { room: { id: 2 } },
      );
      expect(result).toBe(true);
    });
    it('should return false if update affected 0 rows', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 0 } as any);
      const result = await service.update('socket-123', {
        room: { id: 2 } as any,
      });
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should return true if delete affected rows', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove('socket-123');
      expect(mockUserRepository.delete).toHaveBeenCalledWith({
        socketId: 'socket-123',
      });
      expect(result).toBe(true);
    });
    it('should return false if delete affected 0 rows', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 0 });
      const result = await service.remove('socket-123');
      expect(result).toBe(false);
    });
  });
});
