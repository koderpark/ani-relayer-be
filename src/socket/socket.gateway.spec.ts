import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { Server, Socket } from 'socket.io';
import { Video } from '../room/entities/room.entity';

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let socketService: jest.Mocked<SocketService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        {
          provide: SocketService,
          useValue: {
            server: undefined,
            handleConnection: jest.fn(),
            onDisconnection: jest.fn(),
            videoPropagate: jest.fn(),
            kick: jest.fn(),
            chat: jest.fn(),
            chkHost: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);
    socketService = module.get(SocketService);

    // Mock the WebSocket server
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      sockets: {
        sockets: new Map(),
      },
    } as any;

    // Mock socket with handshake
    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: {},
      },
      disconnect: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
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
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should initialize websocket server and set it in socketService', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(mockServer);

      expect(socketService.server).toBe(mockServer);
      expect(loggerSpy).toHaveBeenCalledWith('웹소켓 서버 초기화 ✅');
    });
  });

  describe('handleVideo', () => {
    it('should call socketService.chkHost and videoPropagate', async () => {
      const testVideo: Video = {
        title: 'Test Video',
        episode: '1',
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };

      await gateway.handleVideo(testVideo, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoPropagate).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
    });

    it('should handle video with null values', async () => {
      const testVideo: Video = {
        title: null,
        episode: null,
        url: '',
        speed: 1.0,
        time: 0,
        isPaused: true,
      };

      await gateway.handleVideo(testVideo, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoPropagate).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
    });

    it('should handle video with different speed values', async () => {
      const testVideo: Video = {
        title: 'Test Video',
        episode: '2',
        url: 'https://example.com/video2.mp4',
        speed: 2.0,
        time: 300,
        isPaused: true,
      };

      await gateway.handleVideo(testVideo, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoPropagate).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
    });
  });

  describe('handleChat', () => {
    it('should call socketService.chat', () => {
      const testMessage = 'Hello, world!';

      gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
    });

    it('should handle empty string message', () => {
      const testMessage = '';

      gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
    });

    it('should handle special characters in message', () => {
      const testMessage = '{"message": "테스트", "emoji": "🎉"}';

      gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
    });
  });

  describe('handleRoomKick', () => {
    it('should call socketService.chkHost and kick', async () => {
      const testData = { userId: 'user-456' };

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(
        mockSocket,
        testData.userId,
      );
    });

    it('should handle different user IDs', async () => {
      const testData = { userId: 'another-user-789' };

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(
        mockSocket,
        testData.userId,
      );
    });

    it('should handle empty userId', async () => {
      const testData = { userId: '' };

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(mockSocket, '');
    });
  });

  describe('handleConnection', () => {
    it('should delegate to socketService.handleConnection', () => {
      gateway.handleConnection(mockSocket);

      expect(socketService.handleConnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle connection with different socket IDs', () => {
      const anotherSocket = {
        id: 'another-socket-456',
        handshake: {
          auth: {},
        },
        disconnect: jest.fn(),
        join: jest.fn(),
        emit: jest.fn(),
        broadcast: {
          to: jest.fn().mockReturnThis(),
          emit: jest.fn(),
        },
      } as any;

      gateway.handleConnection(anotherSocket);

      expect(socketService.handleConnection).toHaveBeenCalledWith(
        anotherSocket,
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should call socketService.onDisconnection', () => {
      gateway.handleDisconnect(mockSocket);

      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle multiple disconnections', () => {
      gateway.handleDisconnect(mockSocket);
      gateway.handleDisconnect(mockSocket);

      expect(socketService.onDisconnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('Logger integration', () => {
    it('should use Logger instance', () => {
      expect(gateway['logger']).toBeInstanceOf(Logger);
    });

    it('should have correct logger context', () => {
      expect(gateway['logger']['context']).toBe('websocket');
    });
  });

  describe('Integration with SocketService', () => {
    it('should have socketService dependency injected', () => {
      expect(gateway['socketService']).toBeDefined();
      expect(gateway['socketService']).toBe(socketService);
    });

    it('should pass correct parameters to socketService methods', async () => {
      // Test video handling
      const testVideo: Video = {
        title: 'Integration Test',
        episode: '1',
        url: 'https://test.com/video.mp4',
        speed: 1.5,
        time: 60,
        isPaused: false,
      };

      await gateway.handleVideo(testVideo, mockSocket);
      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoPropagate).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );

      // Test kick handling
      const kickData = { userId: 'user-to-kick' };
      await gateway.handleRoomKick(kickData, mockSocket);
      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(
        mockSocket,
        kickData.userId,
      );

      // Test disconnection handling
      gateway.handleDisconnect(mockSocket);
      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('Comprehensive test coverage', () => {
    it('should handle all message types correctly', async () => {
      // Test video message
      const video: Video = {
        title: 'Test',
        episode: '1',
        url: 'test.mp4',
        speed: 1.0,
        time: 0,
        isPaused: false,
      };
      await gateway.handleVideo(video, mockSocket);
      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoPropagate).toHaveBeenCalledWith(
        mockSocket,
        video,
      );

      // Test chat message
      gateway.handleChat('test message', mockSocket);
      expect(socketService.chat).toHaveBeenCalledWith(
        mockSocket,
        'test message',
      );

      // Test kick message
      await gateway.handleRoomKick({ userId: 'test' }, mockSocket);
      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(mockSocket, 'test');
    });

    it('should handle connection and disconnection lifecycle', () => {
      // Test connection
      gateway.handleConnection(mockSocket);
      expect(socketService.handleConnection).toHaveBeenCalledWith(mockSocket);

      // Test disconnection
      gateway.handleDisconnect(mockSocket);
      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('Error handling', () => {
    it('should handle socketService errors gracefully', async () => {
      const testError = new Error('Service error');
      socketService.chkHost.mockRejectedValue(testError);

      await expect(
        gateway.handleVideo({} as Video, mockSocket),
      ).rejects.toThrow('Service error');
    });

    it('should handle disconnection errors gracefully', () => {
      const testError = new Error('Disconnection failed');
      socketService.onDisconnection.mockImplementation(() => {
        throw testError;
      });

      expect(() => gateway.handleDisconnect(mockSocket)).toThrow(
        'Disconnection failed',
      );
    });
  });
});
