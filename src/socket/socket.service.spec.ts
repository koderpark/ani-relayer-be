import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { UserService } from '../user/user.service';
import { RoomService } from '../room/room.service';
import { VideoService } from '../video/video.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { Room } from '../room/entities/room.entity';
import { Video, Chat, UserInfo } from '../interface';

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
            roomInfo: jest.fn(),
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
      handshake: {
        auth: {},
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      broadcast: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  describe('msgExcludeMe', () => {
    it('should broadcast event to room excluding sender', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        room: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.msgExcludeMe(mockSocket, 'testEvent', { data: 'test' });

      expect(userService.read).toHaveBeenCalledWith('socket-123', ['room']);
      expect(mockSocket.broadcast.to).toHaveBeenCalledWith('1');
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('testEvent', {
        data: 'test',
      });
    });
  });

  describe('roomChanged', () => {
    it('should emit roomChanged event with room info', async () => {
      const mockRoomInfo = {
        id: 1,
        name: 'Test Room',
        host: 'host-123',
        user: [],
      };

      jest.spyOn(roomService, 'roomInfo').mockResolvedValue(mockRoomInfo);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.roomChanged(1);

      expect(roomService.roomInfo).toHaveBeenCalledWith(1);
      expect(service.msgInRoom).toHaveBeenCalledWith(
        1,
        'roomChanged',
        mockRoomInfo,
      );
    });

    it('should handle null room info gracefully', async () => {
      jest.spyOn(roomService, 'roomInfo').mockResolvedValue(null);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.roomChanged(1);

      expect(roomService.roomInfo).toHaveBeenCalledWith(1);
      expect(service.msgInRoom).toHaveBeenCalledWith(1, 'roomChanged', null);
    });
  });

  describe('kick', () => {
    it('should kick user successfully', async () => {
      const targetSocket = {
        id: 'target-123',
        disconnect: jest.fn(),
      } as any;

      mockServer.sockets.sockets.set('target-123', targetSocket);

      await service.kick(mockSocket, 'target-123');

      expect(targetSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should throw error when target user not found', async () => {
      await expect(service.kick(mockSocket, 'nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle kick errors gracefully', async () => {
      const targetSocket = {
        id: 'target-123',
        disconnect: jest.fn().mockImplementation(() => {
          throw new Error('Disconnect failed');
        }),
      } as any;

      mockServer.sockets.sockets.set('target-123', targetSocket);

      await expect(service.kick(mockSocket, 'target-123')).rejects.toThrow(
        'Disconnect failed',
      );
    });
  });

  describe('videoPropagate', () => {
    it('should update video and propagate to other users', async () => {
      const mockVideo: Video = {
        title: 'Test Video',
        episode: '1',
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };

      jest.spyOn(service, 'msgExcludeMe').mockResolvedValue(undefined);

      await service.videoPropagate(mockSocket, mockVideo);

      expect(videoService.update).toHaveBeenCalledWith(mockSocket, mockVideo);
      expect(service.msgExcludeMe).toHaveBeenCalledWith(
        mockSocket,
        'videoChanged',
        mockVideo,
      );
    });
  });

  describe('chat', () => {
    it('should send chat message to room', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        room: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      jest.spyOn(service, 'msgInRoom').mockResolvedValue(undefined);

      await service.chat(mockSocket, 'Hello, world!');

      expect(userService.read).toHaveBeenCalledWith('socket-123', ['room']);
      expect(service.msgInRoom).toHaveBeenCalledWith(1, 'chat', {
        senderId: 'socket-123',
        senderName: 'testuser',
        message: 'Hello, world!',
      });
    });
  });

  describe('chkHost', () => {
    it('should disconnect non-host users', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.chkHost(mockSocket);

      expect(userService.read).toHaveBeenCalledWith('socket-123', ['host']);
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should allow host users to continue', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testuser',
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);

      await service.chkHost(mockSocket);

      expect(userService.read).toHaveBeenCalledWith('socket-123', ['host']);
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('handleConnection', () => {
    it('should handle host connection successfully', async () => {
      mockSocket.handshake.auth = {
        type: 'host',
        username: 'testhost',
        name: 'Test Room',
        password: '1234',
      };

      const mockUser = {
        id: 'socket-123',
        name: 'testhost',
        createdAt: new Date(),
      } as any;

      const mockRoom = {
        id: 1,
        name: 'Test Room',
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.create.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.handleConnection(mockSocket);

      expect(userService.create).toHaveBeenCalledWith('socket-123', 'testhost');
      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        1234,
      );
      expect(mockSocket.join).toHaveBeenCalledWith('1');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
      expect(mockSocket.emit).toHaveBeenCalledWith('user', {
        id: 'socket-123',
        name: 'testhost',
        createdAt: mockUser.createdAt,
        roomId: 1,
        isHost: true,
      });
    });

    it('should handle peer connection successfully', async () => {
      mockSocket.handshake.auth = {
        type: 'peer',
        username: 'testpeer',
        roomId: '123',
        password: '5678',
      };

      const mockUser = {
        id: 'socket-123',
        name: 'testpeer',
        createdAt: new Date(),
      } as any;

      const mockRoom = {
        id: 123,
        name: 'Existing Room',
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.join.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.handleConnection(mockSocket);

      expect(userService.create).toHaveBeenCalledWith('socket-123', 'testpeer');
      expect(roomService.join).toHaveBeenCalledWith('socket-123', 123, 5678);
      expect(mockSocket.join).toHaveBeenCalledWith('123');
      expect(service.roomChanged).toHaveBeenCalledWith(123);
      expect(mockSocket.emit).toHaveBeenCalledWith('user', {
        id: 'socket-123',
        name: 'testpeer',
        createdAt: mockUser.createdAt,
        roomId: 123,
        isHost: false,
      });
    });

    it('should throw error for invalid connection type', async () => {
      mockSocket.handshake.auth = {
        type: 'invalid',
        username: 'testuser',
      };

      await expect(service.handleConnection(mockSocket)).rejects.toThrow(
        'invalid_input_type',
      );
    });

    it('should throw error when room creation fails', async () => {
      mockSocket.handshake.auth = {
        type: 'host',
        username: 'testhost',
        name: 'Test Room',
        password: '1234',
      };

      userService.create.mockResolvedValue({} as any);
      jest.spyOn(service, 'roomCreate').mockResolvedValue(null);

      await expect(service.handleConnection(mockSocket)).rejects.toThrow(
        'room_failed',
      );
    });
  });

  describe('onDisconnection', () => {
    it('should handle host disconnection', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testhost',
        room: { id: 1 },
        host: { id: 1 },
      } as any;

      userService.read.mockResolvedValue(mockUser);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockSocket);

      expect(roomService.remove).toHaveBeenCalledWith('socket-123');
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
    });

    it('should handle peer disconnection', async () => {
      const mockUser = {
        id: 'socket-123',
        name: 'testpeer',
        room: { id: 1 },
        host: null,
      } as any;

      userService.read.mockResolvedValue(mockUser);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      await service.onDisconnection(mockSocket);

      expect(roomService.remove).not.toHaveBeenCalled();
      expect(userService.remove).toHaveBeenCalledWith('socket-123');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
    });
  });

  describe('roomCreate', () => {
    it('should create host room', async () => {
      mockSocket.handshake.auth = {
        type: 'host',
        name: 'Test Room',
        password: '1234',
      };

      const mockRoom = { id: 1, name: 'Test Room' } as any;
      roomService.create.mockResolvedValue(mockRoom);

      const result = await service.roomCreate(mockSocket);

      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        1234,
      );
      expect(result).toBe(mockRoom);
    });

    it('should join peer room', async () => {
      mockSocket.handshake.auth = {
        type: 'peer',
        roomId: '123',
        password: '5678',
      };

      const mockRoom = { id: 123, name: 'Existing Room' } as any;
      roomService.join.mockResolvedValue(mockRoom);

      const result = await service.roomCreate(mockSocket);

      expect(roomService.join).toHaveBeenCalledWith('socket-123', 123, 5678);
      expect(result).toBe(mockRoom);
    });

    it('should handle missing room type', async () => {
      mockSocket.handshake.auth = {};

      const result = await service.roomCreate(mockSocket);

      expect(result).toBeNull();
    });

    it('should convert string password to number', async () => {
      mockSocket.handshake.auth = {
        type: 'host',
        name: 'Test Room',
        password: '9999',
      };

      const mockRoom = { id: 1, name: 'Test Room' } as any;
      roomService.create.mockResolvedValue(mockRoom);

      await service.roomCreate(mockSocket);

      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        9999,
      );
    });

    it('should handle empty password as 0', async () => {
      mockSocket.handshake.auth = {
        type: 'host',
        name: 'Test Room',
        password: '',
      };

      const mockRoom = { id: 1, name: 'Test Room' } as any;
      roomService.create.mockResolvedValue(mockRoom);

      await service.roomCreate(mockSocket);

      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        0,
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle complete connection lifecycle', async () => {
      // Setup
      mockSocket.handshake.auth = {
        type: 'host',
        username: 'testhost',
        name: 'Test Room',
        password: '1234',
      };

      const mockUser = {
        id: 'socket-123',
        name: 'testhost',
        createdAt: new Date(),
      } as any;

      const mockRoom = {
        id: 1,
        name: 'Test Room',
      } as any;

      userService.create.mockResolvedValue(mockUser);
      roomService.create.mockResolvedValue(mockRoom);
      jest.spyOn(service, 'roomChanged').mockResolvedValue(undefined);

      // Execute
      await service.handleConnection(mockSocket);

      // Verify
      expect(userService.create).toHaveBeenCalledWith('socket-123', 'testhost');
      expect(roomService.create).toHaveBeenCalledWith(
        'socket-123',
        'Test Room',
        1234,
      );
      expect(mockSocket.join).toHaveBeenCalledWith('1');
      expect(service.roomChanged).toHaveBeenCalledWith(1);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'user',
        expect.objectContaining({
          id: 'socket-123',
          name: 'testhost',
          roomId: 1,
          isHost: true,
        }),
      );
    });

    it('should handle video propagation workflow', async () => {
      const mockVideo: Video = {
        title: 'Test Video',
        episode: '1',
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };

      jest.spyOn(service, 'msgExcludeMe').mockResolvedValue(undefined);

      await service.videoPropagate(mockSocket, mockVideo);

      expect(videoService.update).toHaveBeenCalledWith(mockSocket, mockVideo);
      expect(service.msgExcludeMe).toHaveBeenCalledWith(
        mockSocket,
        'videoChanged',
        mockVideo,
      );
    });
  });
}); 