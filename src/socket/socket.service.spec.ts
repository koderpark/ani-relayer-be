import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { UserService } from '../user/user.service';
import { RoomService } from '../room/room.service';
import { VideoService } from '../video/video.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

describe('SocketService', () => {
  let service: SocketService;
  let userService: jest.Mocked<UserService>;
  let roomService: jest.Mocked<RoomService>;
  let videoService: jest.Mocked<VideoService>;
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
            update: jest.fn(),
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
            roomMetadata: jest.fn(),
          },
        },
        {
          provide: VideoService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SocketService>(SocketService);
    userService = module.get(UserService);
    roomService = module.get(RoomService);
    videoService = module.get(VideoService);

    // Mock the WebSocket server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map(),
      },
    } as any;
    service.server = mockServer;

    // Mock socket
    mockSocket = {
      id: 'socket-123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('msgInRoom', () => {
    it('should emit event to room with body', async () => {
      const roomId = 1;
      const eventName = 'testEvent';
      const body = { message: 'test message' };

      await service.msgInRoom(roomId, eventName, body);

      expect(mockServer.to).toHaveBeenCalledWith('1');
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, body);
    });

    it('should emit event to room without body', async () => {
      const roomId = 1;
      const eventName = 'testEvent';

      await service.msgInRoom(roomId, eventName);

      expect(mockServer.to).toHaveBeenCalledWith('1');
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, undefined);
    });

    it('should handle string roomId conversion', async () => {
      await service.msgInRoom(123, 'test');

      expect(mockServer.to).toHaveBeenCalledWith('123');
    });
  });

  describe('roomChanged', () => {
    it('should emit roomChanged event with room metadata', async () => {
      const mockMetadata = {
        id: 1,
        name: 'Test Room',
        host: 'host-123',
        user: [],
      };

      jest.spyOn(roomService, 'roomMetadata').mockResolvedValue(mockMetadata);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.roomChanged(1);

      expect(roomService.roomMetadata).toHaveBeenCalledWith(1);
      expect(service.msgInRoom).toHaveBeenCalledWith(
        1,
        'roomChanged',
        mockMetadata,
      );
    });

    it('should handle null metadata gracefully', async () => {
      jest.spyOn(roomService, 'roomMetadata').mockResolvedValue(null);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.roomChanged(1);

      expect(roomService.roomMetadata).toHaveBeenCalledWith(1);
      expect(service.msgInRoom).toHaveBeenCalledWith(1, 'roomChanged', null);
    });
  });

  describe('onHostConnection', () => {
    let mockClient: Socket;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
        join: jest.fn(),
      } as any;
    });

    it('should create user and room for host successfully', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        password: 1234,
        users: [mockUser],
        host: mockUser,
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.create.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      const result = await service.onHostConnection(mockClient, {
        username: 'koderpark',
        name: 'Test Room',
        password: 1234,
      });

      expect(userService.create).toHaveBeenCalledWith(
        'socket-123',
        'koderpark',
      );
      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        1234,
      );
      expect(mockClient.join).toHaveBeenCalledWith('1');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
      expect(result).toBe(mockRoom);
    });

    it('should handle host connection with different username', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 2,
        name: 'Another Room',
        password: 5678,
        users: [mockUser],
        host: mockUser,
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.create.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      const result = await service.onHostConnection(mockClient, {
        username: 'testuser',
        name: 'Another Room',
        password: 5678,
      });

      expect(userService.create).toHaveBeenCalledWith('socket-123', 'testuser');
      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Another Room',
        5678,
      );
      expect(mockClient.join).toHaveBeenCalledWith('2');
      expect(service.roomChanged).toHaveBeenCalledWith(2);
      expect(result).toBe(mockRoom);
    });
  });

  describe('onPeerConnection', () => {
    let mockClient: Socket;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
        join: jest.fn(),
      } as any;
    });

    it('should create user and join room for peer successfully', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        password: 1234,
        users: [mockUser],
        host: mockUser,
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.join.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      const result = await service.onPeerConnection(mockClient, {
        username: 'koderpark',
        roomId: 1,
        password: 1234,
      });

      expect(userService.create).toHaveBeenCalledWith(
        'socket-123',
        'koderpark',
      );
      expect(roomService.join).toHaveBeenCalledWith('socket-123', 1, 1234);
      expect(mockClient.join).toHaveBeenCalledWith('1');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
      expect(result).toBe(mockRoom);
    });

    it('should create user and join room for peer without password', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 1,
        name: 'Test Room',
        password: null,
        users: [mockUser],
        host: mockUser,
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.join.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      const result = await service.onPeerConnection(mockClient, {
        username: 'koderpark',
        roomId: 1,
      });

      expect(userService.create).toHaveBeenCalledWith(
        'socket-123',
        'koderpark',
      );
      expect(roomService.join).toHaveBeenCalledWith('socket-123', 1, undefined);
      expect(mockClient.join).toHaveBeenCalledWith('1');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
      expect(result).toBe(mockRoom);
    });

    it('should handle peer connection with different room', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        createdAt: new Date(),
      } as any;
      const mockRoom = {
        id: 5,
        name: 'Another Room',
        password: 9999,
        users: [mockUser],
        host: mockUser,
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.join.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      const result = await service.onPeerConnection(mockClient, {
        username: 'testuser',
        roomId: 5,
        password: 9999,
      });

      expect(userService.create).toHaveBeenCalledWith('socket-123', 'testuser');
      expect(roomService.join).toHaveBeenCalledWith('socket-123', 5, 9999);
      expect(mockClient.join).toHaveBeenCalledWith('5');
      expect(service.roomChanged).toHaveBeenCalledWith(5);
      expect(result).toBe(mockRoom);
    });
  });

  describe('onDisconnection', () => {
    let mockClient: Socket;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
      } as any;
    });

    it('should handle host disconnection', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 1 },
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      roomService.remove.mockResolvedValue(true);
      userService.remove.mockResolvedValue(true);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockClient);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(roomService.remove).toHaveBeenCalledWith('socket-123');
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
    });

    it('should handle peer disconnection', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 1 },
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);
      userService.remove.mockResolvedValue(true);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockClient);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(roomService.remove).not.toHaveBeenCalled();
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
    });

    it('should handle disconnection when user has no room', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: null,
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);
      userService.remove.mockResolvedValue(true);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockClient);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(roomService.remove).not.toHaveBeenCalled();
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).not.toHaveBeenCalled();
    });

    it('should handle disconnection when user is host but has no room', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: null,
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      roomService.remove.mockResolvedValue(true);
      userService.remove.mockResolvedValue(true);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockClient);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(roomService.remove).toHaveBeenCalledWith('socket-123');
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).not.toHaveBeenCalled();
    });

    it('should handle errors during disconnection gracefully', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 1 },
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);
      userService.remove.mockRejectedValue(new Error('Database error'));
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await expect(service.onDisconnection(mockClient)).rejects.toThrow(
        'Database error',
      );

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
    });
  });

  describe('msgExcludeMe', () => {
    let mockClient: Socket;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
        broadcast: {
          to: jest.fn().mockReturnThis(),
          emit: jest.fn(),
        },
      } as any;
    });

    it('should broadcast event to room excluding sender', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.msgExcludeMe(mockClient, 'testEvent', { message: 'test' });

      expect(userService.read).toHaveBeenCalledWith('socket-123', ['room']);
      expect(mockClient.broadcast.to).toHaveBeenCalledWith('1');
      expect(mockClient.broadcast.emit).toHaveBeenCalledWith('testEvent', {
        message: 'test',
      });
    });

    it('should broadcast event without body', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.msgExcludeMe(mockClient, 'testEvent');

      expect(mockClient.broadcast.emit).toHaveBeenCalledWith(
        'testEvent',
        undefined,
      );
    });

    it('should handle different room IDs', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        room: { id: 999 },
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.msgExcludeMe(mockClient, 'testEvent', { data: 'test' });

      expect(mockClient.broadcast.to).toHaveBeenCalledWith('999');
    });
  });

  describe('kick', () => {
    let mockClient: Socket;
    let mockTargetSocket: Socket;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
      } as any;

      mockTargetSocket = {
        id: 'target-456',
        disconnect: jest.fn(),
      } as any;

      // Setup mock server with target socket
      mockServer.sockets.sockets.set('target-456', mockTargetSocket);
    });

    it('should successfully kick user', async () => {
      await service.kick(mockClient, 'target-456');

      expect(mockTargetSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should throw BadRequestException when user not found', async () => {
      await expect(
        service.kick(mockClient, 'nonexistent-user'),
      ).rejects.toThrow(BadRequestException);
      expect(mockTargetSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should handle kick operation with different user IDs', async () => {
      const anotherTargetSocket = {
        id: 'another-target',
        disconnect: jest.fn(),
      } as any;
      mockServer.sockets.sockets.set('another-target', anotherTargetSocket);

      await service.kick(mockClient, 'another-target');

      expect(anotherTargetSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should log successful kick operation', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.kick(mockClient, 'target-456');

      expect(logSpy).toHaveBeenCalledWith('User target-456 has been kicked');
    });

    it('should handle and log kick operation errors', async () => {
      const errorSpy = jest.spyOn(service['logger'], 'error');
      mockTargetSocket.disconnect = jest.fn().mockImplementation(() => {
        throw new Error('Disconnect failed');
      });

      await expect(service.kick(mockClient, 'target-456')).rejects.toThrow(
        'Disconnect failed',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to kick user target-456:',
        'Disconnect failed',
      );
    });
  });

  describe('videoChanged', () => {
    let mockClient: Socket;
    let mockVideo: any;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
      } as any;

      mockVideo = {
        title: 'Test Anime',
        episode: 'Episode 1',
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };
    });

    it('should update video when user is host', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      videoService.update.mockResolvedValue(undefined);
      jest.spyOn(service, 'msgExcludeMe').mockResolvedValue(undefined);

      await service.videoChanged(mockClient, mockVideo);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(videoService.update).toHaveBeenCalledWith(mockClient, mockVideo);
      expect(service.msgExcludeMe).toHaveBeenCalledWith(
        mockClient,
        'videoChanged',
        mockVideo,
      );
    });

    it('should not update video when user is not host', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.videoChanged(mockClient, mockVideo);

      expect(userService.read).toHaveBeenCalledWith('socket-123', [
        'room',
        'host',
      ]);
      expect(videoService.update).not.toHaveBeenCalled();
      // Note: msgExcludeMe is not called when user is not host
      expect(logSpy).toHaveBeenCalledWith(
        `${JSON.stringify(mockUser)} is not host`,
      );
    });

    it('should handle video with different properties', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        host: { id: 1 },
      } as any;

      const customVideo = {
        title: 'Custom Anime',
        episode: 'Episode 5',
        url: 'https://custom.com/video.mp4',
        speed: 1.5,
        time: 300,
        isPaused: true,
      };

      userService.read.mockResolvedValue(mockUser);
      videoService.update.mockResolvedValue(undefined);
      jest.spyOn(service, 'msgExcludeMe').mockResolvedValue(undefined);

      await service.videoChanged(mockClient, customVideo);

      expect(videoService.update).toHaveBeenCalledWith(mockClient, customVideo);
      expect(service.msgExcludeMe).toHaveBeenCalledWith(
        mockClient,
        'videoChanged',
        customVideo,
      );
    });

    it('should handle video service update errors', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      videoService.update.mockRejectedValue(new Error('Update failed'));
      jest.spyOn(service, 'msgExcludeMe').mockResolvedValue(undefined);

      await expect(service.videoChanged(mockClient, mockVideo)).rejects.toThrow(
        'Update failed',
      );

      expect(videoService.update).toHaveBeenCalledWith(mockClient, mockVideo);
      // Note: msgExcludeMe is not called when video service update fails
    });

    it('should handle msgExcludeMe errors gracefully', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'koderpark',
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      videoService.update.mockResolvedValue(undefined);
      jest
        .spyOn(service, 'msgExcludeMe')
        .mockRejectedValue(new Error('Broadcast failed'));

      await expect(service.videoChanged(mockClient, mockVideo)).rejects.toThrow(
        'Broadcast failed',
      );

      expect(videoService.update).toHaveBeenCalledWith(mockClient, mockVideo);
    });
  });
}); 