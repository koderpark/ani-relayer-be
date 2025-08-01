import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { UserService } from '../user/user.service';
import { RoomService } from '../room/room.service';
import { BadRequestException } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

describe('SocketService', () => {
  let service: SocketService;
  let userService: jest.Mocked<UserService>;
  let roomService: jest.Mocked<RoomService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            read: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: RoomService,
          useValue: {
            create: jest.fn(),
            join: jest.fn(),
            read: jest.fn(),
            readMine: jest.fn(),
            remove: jest.fn(),
            leave: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SocketService>(SocketService);
    userService = module.get(UserService);
    roomService = module.get(RoomService);

    // Mock the WebSocket server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
    service.server = mockServer;

    // Mock socket
    mockSocket = {
      id: 'socket-123',
      join: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('roomMetadata', () => {
    it('should return room metadata', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        users: [mockUser],
        owner: mockUser,
      } as any;

      jest.spyOn(roomService, 'read').mockResolvedValue(mockRoom);
      const result = await service.roomMetadata(1);
      expect(roomService.read).toHaveBeenCalledWith(1, ['users', 'owner']);
      expect(result).toEqual({
        id: 1,
        name: 'Test Room',
        user: [{ id: 'socket-123', name: 'koderpark', isHost: true }],
      });
    });
  });

  describe('msgInRoom', () => {
    it('should emit event to room', async () => {
      await service.msgInRoom(1, 'test', 'test');
      expect(mockServer.to).toHaveBeenCalledWith('1');
      expect(mockServer.emit).toHaveBeenCalledWith('test', 'test');
    });
  });

  describe('roomChanged', () => {
    it('should emit roomChanged event with room metadata', async () => {
      const mockMetadata = {
        id: 1,
        name: 'Test Room',
        user: [],
      };
      jest.spyOn(service, 'roomMetadata').mockResolvedValue(mockMetadata);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.roomChanged(1);

      expect(service.roomMetadata).toHaveBeenCalledWith(1);
      expect(service.msgInRoom).toHaveBeenCalledWith(
        1,
        'roomChanged',
        expect.any(Promise),
      );
    });
  });

  // describe('onConnection', () => {
  //   let mockClient: Socket;

  //   beforeEach(() => {
  //     mockClient = {
  //       id: 'socket-123',
  //       join: jest.fn(),
  //       disconnect: jest.fn(),
  //     } as any;
  //   });

  //   it('should throw BadRequestException if host without roomName', async () => {
  //     await expect(
  //       service.onConnection(mockClient, 'host', { name: 'test' }),
  //     ).rejects.toThrow(BadRequestException);
  //   });

  //   it('should throw BadRequestException if peer without roomId', async () => {
  //     await expect(
  //       service.onConnection(mockClient, 'peer', { name: 'test' }),
  //     ).rejects.toThrow(BadRequestException);
  //   });

  //   it('should create user and room for host', async () => {
  //     const mockUser = { id: 'socket-123', name: 'koderpark', createdAt: new Date() } as any;
  //     const mockRoom = {
  //       id: 1,
  //       name: 'Test Room',
  //       password: 1234,
  //       users: [mockUser],
  //       owner: mockUser
  //     } as any;

  //     userService.create.mockResolvedValue(mockUser);
  //     roomService.create.mockResolvedValue(mockRoom);
  //     roomService.readMine.mockResolvedValue(mockRoom);
  //     jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

  //     const result = await service.onConnection(mockClient, 'host', {
  //       name: mockUser.name,
  //       roomName: mockRoom.name,
  //       password: mockRoom.password,
  //     });

  //     expect(userService.create).toHaveBeenCalledWith('socket-123', mockUser.name);
  //     expect(roomService.create).toHaveBeenCalledWith('socket-123', mockRoom.name, mockRoom.password);
  //     expect(mockClient.join).toHaveBeenCalledWith('1');
  //     expect(result).toBe(mockRoom);
  //   });

  //   it('should create user and join room for peer', async () => {
  //     const mockUser = { id: 'socket-123', name: 'koderpark', createdAt: new Date() } as any;
  //     const mockUser2 = { id: 'socket-456', name: 'test', createdAt: new Date() } as any;
  //     const mockRoom = {
  //       id: 1,
  //       name: 'Test Room',
  //       password: 1234,
  //       users: [mockUser, mockUser2],
  //       owner: mockUser2
  //     } as any;

  //     userService.create.mockResolvedValue(mockUser);
  //     roomService.join.mockResolvedValue(mockRoom);
  //     roomService.readMine.mockResolvedValue(mockRoom);
  //     jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

  //     const result = await service.onConnection(mockClient, 'peer', {
  //       name: 'test',
  //       roomId: 1,
  //       password: 1234,
  //     });

  //     expect(userService.create).toHaveBeenCalledWith('socket-123', 'test');
  //     expect(roomService.join).toHaveBeenCalledWith('socket-123', 1, 1234);
  //     expect(mockClient.join).toHaveBeenCalledWith('1');
  //     expect(result).toBe(mockRoom);
  //   });

  //   it('should disconnect if room not found after connection', async () => {
  //     const mockUser = { id: 'socket-123', name: 'koderpark', createdAt: new Date() } as any;
  //     const mockRoom = {
  //       id: 1,
  //       name: 'Test Room',
  //       password: 1234,
  //       users: [mockUser],
  //       owner: mockUser
  //     } as any;

  //     userService.create.mockResolvedValue(mockUser);
  //     roomService.join.mockResolvedValue(mockRoom);
  //     roomService.readMine.mockResolvedValue(undefined);
  //     jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

  //     await expect(service.onConnection(mockClient, 'peer', {
  //       name: 'test',
  //       roomId: 1,
  //     })).rejects.toThrow('room_not_found');
  //     await expect(mockClient.disconnect).toHaveBeenCalled();
  //   });
  // });
}); 