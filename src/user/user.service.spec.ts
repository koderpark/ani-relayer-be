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
    jest.clearAllMocks();
    
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
      const result = await service.create('socket-123', 'koderpark');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: 'socket-123',
        name: 'koderpark',
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
        where: { id: 'socket-123' },
        relations: [],
      });
      expect(result).toBe(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);
      await expect(service.read('socket-123')).rejects.toThrow(
        'user_not_found',
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'socket-123' },
        relations: [],
      });
    });

    it('should return user with relations if specified', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.read('socket-123', ['room', 'host']);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'socket-123' },
        relations: ['room', 'host'],
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('update', () => {
    it('should return true if user exists and update succeeds', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        name: 'koderpark2222',
      });

      const result = await service.update('socket-123', {
        name: 'koderpark2222',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'socket-123' },
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'socket-123',
          name: 'koderpark2222',
        }),
      );
      expect(result).toBe(true);
    });
    
    it('should return false if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.update('socket-123', {
        name: 'koderpark2222',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'socket-123' },
      });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should return true if delete affected rows', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove('socket-123');
      expect(mockUserRepository.delete).toHaveBeenCalledWith({
        id: 'socket-123',
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
