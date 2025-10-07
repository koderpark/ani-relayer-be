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
    softDelete: jest.fn(),
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
      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });
      const result = await service.remove('socket-123');
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith({
        id: 'socket-123',
      });
      expect(result).toBe(true);
    });
    it('should return false if delete affected 0 rows', async () => {
      mockUserRepository.softDelete.mockResolvedValue({ affected: 0 });
      const result = await service.remove('socket-123');
      expect(result).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle create with empty name', async () => {
      mockUserRepository.create.mockReturnValue({ ...mockUser, name: '' });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, name: '' });

      const result = await service.create('socket-123', '');

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: 'socket-123',
        name: '',
      });
      expect(result.name).toBe('');
    });

    it('should handle create with very long name', async () => {
      const longName = 'A'.repeat(1000);
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        name: longName,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        name: longName,
      });

      const result = await service.create('socket-123', longName);

      expect(result.name).toBe(longName);
    });

    it('should handle create with special characters in name', async () => {
      const specialName = 'User with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        name: specialName,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        name: specialName,
      });

      const result = await service.create('socket-123', specialName);

      expect(result.name).toBe(specialName);
    });

    it('should handle read with empty string ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);

      await expect(service.read('')).rejects.toThrow('user_not_found');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '' },
        relations: [],
      });
    });

    it('should handle read with very long ID', async () => {
      const longId = 'A'.repeat(1000);
      mockUserRepository.findOne.mockResolvedValue(undefined);

      await expect(service.read(longId)).rejects.toThrow('user_not_found');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: longId },
        relations: [],
      });
    });

    it('should handle read with special characters in ID', async () => {
      const specialId = 'socket-123!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockUserRepository.findOne.mockResolvedValue(undefined);

      await expect(service.read(specialId)).rejects.toThrow('user_not_found');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: specialId },
        relations: [],
      });
    });

    it('should handle update with empty string ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.update('', { name: 'new name' });

      expect(result).toBe(false);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '' },
      });
    });

    it('should handle update with null data', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      const result = await service.update('socket-123', null);

      expect(result).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(existingUser);
    });

    it('should handle update with undefined data', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      const result = await service.update('socket-123', undefined);

      expect(result).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(existingUser);
    });

    it('should handle update with empty object data', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      const result = await service.update('socket-123', {});

      expect(result).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(existingUser);
    });

    it('should handle update with all user properties', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      const updateData = {
        name: 'new name',
        roomId: 999,
        hostId: 888,
        createdAt: new Date('2023-01-01'),
      };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('socket-123', updateData);

      expect(result).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should handle remove with empty string ID', async () => {
      mockUserRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await service.remove('');

      expect(result).toBe(false);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith({ id: '' });
    });

    it('should handle remove with very long ID', async () => {
      const longId = 'A'.repeat(1000);
      mockUserRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await service.remove(longId);

      expect(result).toBe(false);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith({
        id: longId,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.read('socket-123')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle update database errors gracefully', async () => {
      const existingUser = { ...mockUser, name: 'koderpark' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockRejectedValue(
        new Error('Save operation failed'),
      );

      await expect(
        service.update('socket-123', { name: 'new name' }),
      ).rejects.toThrow('Save operation failed');
    });

    it('should handle remove database errors gracefully', async () => {
      mockUserRepository.softDelete.mockRejectedValue(
        new Error('Delete operation failed'),
      );

      await expect(service.remove('socket-123')).rejects.toThrow(
        'Delete operation failed',
      );
    });

    it('should handle create database errors gracefully', async () => {
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockRejectedValue(
        new Error('Create operation failed'),
      );

      await expect(service.create('socket-123', 'koderpark')).rejects.toThrow(
        'Create operation failed',
      );
    });
  });
});
