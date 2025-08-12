import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { mockRoom, Room } from './entities/room.entity';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { mockUser, User } from '../user/entities/user.entity';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';

describe('RoomService', () => {
  let service: RoomService;
  let userService: jest.Mocked<UserService>;

  const mockRoomRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset all mockRoomRepository methods
    Object.values(mockRoomRepository).forEach(
      (fn) => fn.mockReset && fn.mockReset(),
    );

    // Mock removeAll to avoid constructor issues
    mockRoomRepository.delete.mockResolvedValue({ affected: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
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
    userService = module.get(UserService);

    // Don't clear mocks here as it interferes with the default mock setup
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
      mockRoomRepository.findOne.mockResolvedValue({
        ...mockRoom,
        password: 1234,
      });
      const result = await service.chkPW(1, 1234);
      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'password'],
      });
      expect(result).toBe(true);
    });
    it('should return false if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(undefined);
      const result = await service.chkPW(1, 1234);
      expect(result).toBe(false);
    });
    it('should return false if password does not match', async () => {
      mockRoomRepository.findOne.mockResolvedValue({
        ...mockRoom,
        password: 5678,
      });
      const result = await service.chkPW(1, 1234);
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create and save a room and update user', async () => {
      userService.read.mockResolvedValue(mockUser);
      mockRoomRepository.create.mockReturnValue(mockRoom);
      mockRoomRepository.save.mockResolvedValue(mockRoom);
      userService.update.mockResolvedValue(true);
      const result = await service.create('socket-123', 'Test Room', 1234);
      expect(userService.read).toHaveBeenCalledWith('socket-123');
      expect(mockRoomRepository.create).toHaveBeenCalledWith({
        name: 'Test Room',
        password: 1234,
        host: mockUser,
      });
      expect(mockRoomRepository.save).toHaveBeenCalledWith(mockRoom);
      expect(userService.update).toHaveBeenCalledWith('socket-123', {
        host: mockRoom,
        room: mockRoom,
      });
      expect(result).toBe(mockRoom);
    });
  });

  describe('join', () => {
    it('should throw BadRequestException if user is already a host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: mockRoom });
      jest.spyOn(service, 'read').mockResolvedValue(mockRoom);
      await expect(service.join('socket-123', 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
    });

    it('should throw BadRequestException if password is wrong', async () => {
      userService.read.mockResolvedValue({ ...mockUser, room: null });
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'chkPW').mockResolvedValue(false);

      await expect(service.join('socket-123', 1, 1234)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.chkPW).toHaveBeenCalledWith(1, 1234);
    });

    it('should join room successfully', async () => {
      userService.read.mockResolvedValue({ ...mockUser, room: null });
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'chkPW').mockResolvedValue(true);
      userService.update.mockResolvedValue(true);
      jest.spyOn(service, 'read').mockResolvedValue(mockRoom);

      const result = await service.join('socket-123', 1);

      expect(service.read).toHaveBeenCalledWith(1, ['users']);
      expect(userService.update).toHaveBeenCalledWith('socket-123', {
        room: mockRoom,
      });
      expect(result).toBe(mockRoom);
    });
  });

  describe('read', () => {
    it('should return room if found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      const result = await service.read(1);
      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [],
      });
      expect(result).toBe(mockRoom);
    });
    it('should throw NotFoundException if not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(undefined);
      await expect(service.read(1)).rejects.toThrow(NotFoundException);
    });
    it('should pass relations to findOne', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      await service.read(1, ['users']);
      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
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
      mockRoomRepository.update.mockResolvedValue({ affected: 1 } as any);
      const result = await service.update('socket-123', { name: 'New Name' });
      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(mockRoomRepository.update).toHaveBeenCalledWith(1, {
        name: 'New Name',
      });
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
      mockRoomRepository.update.mockResolvedValue({ affected: 0 } as any);
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
      mockRoomRepository.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.remove('socket-123');
      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(mockRoomRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
    it('should throw if user is not host', async () => {
      userService.read.mockResolvedValue({ ...mockUser, host: null });
      await expect(service.remove('socket-123')).rejects.toThrow(HttpException);
    });
  });

  describe('removeAll', () => {
    it('should return true if delete affected rows', async () => {
      mockRoomRepository.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.removeAll();
      expect(mockRoomRepository.delete).toHaveBeenCalledWith({});
      expect(result).toBe(true);
    });
    it('should return false if delete affected 0 rows', async () => {
      mockRoomRepository.delete.mockResolvedValue({ affected: 0 } as any);
      const result = await service.removeAll();
      expect(result).toBe(false);
    });
  });

  describe('roomMetadata', () => {
    it('should return room metadata successfully', async () => {
      const mockUsers = [
        { id: 'user1', name: 'Alice' },
        { id: 'user2', name: 'Bob' },
        { id: 'user3', name: 'Charlie' },
      ];
      const mockHost = { id: 'user1', name: 'Alice' };
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        users: mockUsers,
        host: mockHost,
      };

      jest.spyOn(service, 'read').mockResolvedValue(mockRoom as any);

      const result = await service.roomMetadata(1);

      expect(service.read).toHaveBeenCalledWith(1, ['users', 'host']);
      expect(result).toEqual({
        id: 1,
        name: 'Test Room',
        host: 'user1',
        user: [
          { id: 'user1', name: 'Alice', isHost: true },
          { id: 'user2', name: 'Bob', isHost: false },
          { id: 'user3', name: 'Charlie', isHost: false },
        ],
      });
    });

    it('should return null when room read fails', async () => {
      jest
        .spyOn(service, 'read')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.roomMetadata(1);

      expect(result).toBeNull();
    });

    it('should return null when room not found', async () => {
      jest.spyOn(service, 'read').mockRejectedValue(new NotFoundException());

      const result = await service.roomMetadata(1);

      expect(result).toBeNull();
    });

    it('should handle empty users array', async () => {
      const mockRoom = {
        id: 1,
        name: 'Empty Room',
        users: [],
        host: { id: 'host1', name: 'Host' },
      };

      jest.spyOn(service, 'read').mockResolvedValue(mockRoom as any);

      const result = await service.roomMetadata(1);

      expect(result).toEqual({
        id: 1,
        name: 'Empty Room',
        host: 'host1',
        user: [],
      });
    });

    it('should sort users alphabetically by name', async () => {
      const mockUsers = [
        { id: 'user3', name: 'Zebra' },
        { id: 'user1', name: 'Alice' },
        { id: 'user2', name: 'Bob' },
      ];
      const mockHost = { id: 'user1', name: 'Alice' };
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        users: mockUsers,
        host: mockHost,
      };

      jest.spyOn(service, 'read').mockResolvedValue(mockRoom as any);

      const result = await service.roomMetadata(1);

      expect(result.user.map((u) => u.name)).toEqual(['Alice', 'Bob', 'Zebra']);
    });
  });

  describe('publicRoom', () => {
    it('should return public room data for unlocked room', async () => {
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        host: { id: '1', name: 'Host User', createdAt: new Date() },
        users: [
          { id: '1', name: 'User 1', createdAt: new Date() },
          { id: '2', name: 'User 2', createdAt: new Date() },
        ],
      };

      // Mock the repository to return null password (unlocked room)
      mockRoomRepository.findOne.mockResolvedValue({
        id: 1,
        password: null,
      } as any);

      const result = await service.publicRoom(mockRoom as any);

      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'password'],
      });

      expect(result).toEqual({
        id: 1,
        name: 'Test Room',
        host: 'Host User',
        userCount: 2,
        isLocked: false,
        vidEpisode: undefined,
        vidTitle: undefined,
      });
    });

    it('should return public room data for locked room', async () => {
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        host: { name: 'Host User' },
        users: [{ id: '1' }],
      };

      mockRoomRepository.findOne.mockResolvedValue({ password: 1234 });

      const result = await service.publicRoom(mockRoom as any);

      expect(result.isLocked).toBe(true);
    });

    it('should handle room with no video metadata', async () => {
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        host: { name: 'Host User' },
        users: [],
        vidTitle: null,
        vidEpisode: null,
      };

      mockRoomRepository.findOne.mockResolvedValue({ password: null });

      const result = await service.publicRoom(mockRoom as any);

      expect(result.vidTitle).toBeNull();
      expect(result.vidEpisode).toBeNull();
      expect(result.userCount).toBe(0);
      expect(result.isLocked).toBe(false); // Should be unlocked
    });
  });

  describe('readAllPublic', () => {
    it('should return all public rooms', async () => {
      const mockRooms = [
        {
          id: 1,
          name: 'Room 1',
          host: { name: 'Host 1' },
          users: [{ id: '1' }],
          vidTitle: 'Video 1',
          vidEpisode: 'Episode 1',
        },
        {
          id: 2,
          name: 'Room 2',
          host: { name: 'Host 2' },
          users: [{ id: '2' }, { id: '3' }],
          vidTitle: 'Video 2',
          vidEpisode: 'Episode 2',
        },
      ];

      mockRoomRepository.find.mockResolvedValue(mockRooms as any);
      jest.spyOn(service, 'publicRoom').mockResolvedValue({
        id: 1,
        name: 'Room 1',
        host: 'Host 1',
        userCount: 1,
        vidTitle: 'Video 1',
        vidEpisode: 'Episode 1',
        isLocked: false,
      });

      const result = await service.readAllPublic();

      expect(mockRoomRepository.find).toHaveBeenCalledWith({
        relations: ['users', 'host'],
      });
      expect(service.publicRoom).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no rooms exist', async () => {
      mockRoomRepository.find.mockResolvedValue([]);

      const result = await service.readAllPublic();

      expect(result).toEqual([]);
    });

    it('should handle single room', async () => {
      const mockRooms = [
        {
          id: 1,
          name: 'Single Room',
          host: { name: 'Single Host' },
          users: [{ id: '1' }],
          vidTitle: 'Single Video',
          vidEpisode: 'Episode 1',
        },
      ];

      mockRoomRepository.find.mockResolvedValue(mockRooms as any);
      jest.spyOn(service, 'publicRoom').mockResolvedValue({
        id: 1,
        name: 'Single Room',
        host: 'Single Host',
        userCount: 1,
        vidTitle: 'Single Video',
        vidEpisode: 'Episode 1',
        isLocked: false,
      });

      const result = await service.readAllPublic();

      expect(result).toHaveLength(1);
    });
  });
});
