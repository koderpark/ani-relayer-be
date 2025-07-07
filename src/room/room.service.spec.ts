import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { mockRoom, Room } from './entities/room.entity';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { mockUser, User } from '../user/entities/user.entity';
import { HttpException, NotFoundException } from '@nestjs/common';

describe('RoomService', () => {
  let service: RoomService;
  let repo: jest.Mocked<Repository<Room>>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            read: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    repo = module.get(getRepositoryToken(Room));
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chkHost', () => {
    it('should return true if user is host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: mockRoom });
      const result = await service.chkHost('socket-123');
      expect(userService.read).toHaveBeenCalledWith('socket-123', ['host']);
      expect(result).toBe(true);
    });
    it('should return false if user is not host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: null });
      const result = await service.chkHost('socket-123');
      expect(result).toBe(false);
    });
  });

  describe('chkPW', () => {
    it('should return true if password matches', async () => {
      repo.findOne.mockResolvedValue({ ...mockRoom, password: 1234 });
      const result = await service.chkPW(1, 1234);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'password'],
      });
      expect(result).toBe(true);
    });
    it('should return false if room not found', async () => {
      repo.findOne.mockResolvedValue(undefined);
      const result = await service.chkPW(1, 1234);
      expect(result).toBe(false);
    });
    it('should return false if password does not match', async () => {
      repo.findOne.mockResolvedValue({ ...mockRoom, password: 5678 });
      const result = await service.chkPW(1, 1234);
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create and save a room and update user', async () => {
      userService.read.mockResolvedValue(mockUser);
      repo.create.mockReturnValue(mockRoom);
      repo.save.mockResolvedValue(mockRoom);
      userService.update.mockResolvedValue(true);
      const result = await service.create('socket-123', 'Test Room', 1234);
      expect(userService.read).toHaveBeenCalledWith('socket-123');
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Test Room',
        password: 1234,
        owner: mockUser,
        users: [mockUser],
      });
      expect(repo.save).toHaveBeenCalledWith(mockRoom);
      expect(userService.update).toHaveBeenCalledWith('socket-123', {
        host: mockRoom,
        room: mockRoom,
      });
      expect(result).toBe(mockRoom);
    });
  });

  describe('read', () => {
    it('should return room if found', async () => {
      repo.findOne.mockResolvedValue(mockRoom);
      const result = await service.read(1);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [],
      });
      expect(result).toBe(mockRoom);
    });
    it('should throw NotFoundException if not found', async () => {
      repo.findOne.mockResolvedValue(undefined);
      await expect(service.read(1)).rejects.toThrow(NotFoundException);
    });
    it('should pass relations to findOne', async () => {
      repo.findOne.mockResolvedValue(mockRoom);
      await service.read(1, ['users']);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['users'],
      });
    });
  });

  describe('readMine', () => {
    it('should return user.room if present', async () => {
      userService.read.mockResolvedValue({ ...mockUser, room: mockRoom });
      const result = await service.readMine('socket-123');
      expect(userService.read).toHaveBeenCalledWith('socket-123', ['room']);
      expect(result).toBe(mockRoom);
    });
    it('should throw NotFoundException if user.room is missing', async () => {
      userService.read.mockResolvedValue({ ...mockUser, room: null });
      await expect(service.readMine('socket-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update room if user is host', async () => {
      userService.read.mockResolvedValue({
        ...mockUser,
        host: { id: 1 } as any,
      });
      repo.update.mockResolvedValue({ affected: 1 } as any);
      const result = await service.update('socket-123', { name: 'New Name' });
      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(repo.update).toHaveBeenCalledWith(1, { name: 'New Name' });
      expect(result).toBe(true);
    });
    it('should throw if user is not host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: null });
      await expect(
        service.update('socket-123', { name: 'New Name' }),
      ).rejects.toThrow(HttpException);
    });
    it('should return false if update affected 0 rows', async () => {
      userService.read.mockResolvedValue({
        ...mockUser,
        host: { id: 1 } as any,
      });
      repo.update.mockResolvedValue({ affected: 0 } as any);
      const result = await service.update('socket-123', { name: 'New Name' });
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete room if user is host', async () => {
      userService.read.mockResolvedValue({
        ...mockUser,
        host: { id: 1 } as any,
      });
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.remove('socket-123');
      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
    it('should throw if user is not host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: null });
      await expect(service.remove('socket-123')).rejects.toThrow(HttpException);
    });
  });

  describe('removeAll', () => {
    it('should return true if delete affected rows', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.removeAll();
      expect(repo.delete).toHaveBeenCalledWith({});
      expect(result).toBe(true);
    });
    it('should return false if delete affected 0 rows', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as any);
      const result = await service.removeAll();
      expect(result).toBe(false);
    });
  });
});
