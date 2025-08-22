import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { Server, Socket } from 'socket.io';
import { Video } from '../interface';

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
            onHostConnection: jest.fn(),
            onPeerConnection: jest.fn(),
            onDisconnection: jest.fn(),
            videoChanged: jest.fn(),
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
    it('should log and call socketService.videoChanged', async () => {
      const testVideo: Video = {
        title: 'Test Video',
        episode: '1',
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleVideo(testVideo, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoChanged).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} sended ${JSON.stringify(testVideo)}`,
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
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleVideo(testVideo, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.videoChanged).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} sended ${JSON.stringify(testVideo)}`,
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
      expect(socketService.videoChanged).toHaveBeenCalledWith(
        mockSocket,
        testVideo,
      );
    });
  });

  describe('handleChat', () => {
    it('should log and call socketService.chat', async () => {
      const testMessage = 'Hello, world!';
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} sended ${JSON.stringify(testMessage)}`,
      );
    });

    it('should handle empty string message', async () => {
      const testMessage = '';
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} sended ${JSON.stringify(testMessage)}`,
      );
    });

    it('should handle special characters in message', async () => {
      const testMessage = '{"message": "테스트", "emoji": "🎉"}';
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleChat(testMessage, mockSocket);

      expect(socketService.chat).toHaveBeenCalledWith(mockSocket, testMessage);
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} sended ${JSON.stringify(testMessage)}`,
      );
    });
  });

  describe('handleRoomKick', () => {
    it('should log and call socketService.kick', async () => {
      const testData = { userId: 'user-456' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(
        mockSocket,
        testData.userId,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} kicked ${testData.userId}`,
      );
    });

    it('should handle different user IDs', async () => {
      const testData = { userId: 'another-user-789' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(
        mockSocket,
        testData.userId,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `${mockSocket.id} kicked ${testData.userId}`,
      );
    });

    it('should handle empty userId', async () => {
      const testData = { userId: '' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleRoomKick(testData, mockSocket);

      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} kicked `);
      expect(socketService.kick).toHaveBeenCalledWith(mockSocket, '');
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      jest.spyOn(gateway, 'handleHostConnection').mockResolvedValue(undefined);
      jest.spyOn(gateway, 'handlePeerConnection').mockResolvedValue(undefined);
    });

    it('should handle host connection type', async () => {
      mockSocket.handshake.auth = { type: 'host' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} connected`);
      expect(gateway.handleHostConnection).toHaveBeenCalledWith(mockSocket);
      expect(gateway.handlePeerConnection).not.toHaveBeenCalled();
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should handle peer connection type', async () => {
      mockSocket.handshake.auth = { type: 'peer' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} connected`);
      expect(gateway.handlePeerConnection).toHaveBeenCalledWith(mockSocket);
      expect(gateway.handleHostConnection).not.toHaveBeenCalled();
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should handle invalid connection type', async () => {
      mockSocket.handshake.auth = { type: 'invalid' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      await gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} connected`);
      expect(errorSpy).toHaveBeenCalledWith(expect.any(BadRequestException));
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle missing connection type', async () => {
      mockSocket.handshake.auth = {};
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      await gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} connected`);
      expect(errorSpy).toHaveBeenCalledWith(expect.any(BadRequestException));
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle connection error from host handler', async () => {
      mockSocket.handshake.auth = { type: 'host' };
      const testError = new Error('Host connection failed');
      jest.spyOn(gateway, 'handleHostConnection').mockRejectedValue(testError);
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      await gateway.handleConnection(mockSocket);

      expect(errorSpy).toHaveBeenCalledWith(testError);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle connection error from peer handler', async () => {
      mockSocket.handshake.auth = { type: 'peer' };
      const testError = new Error('Peer connection failed');
      jest.spyOn(gateway, 'handlePeerConnection').mockRejectedValue(testError);
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      await gateway.handleConnection(mockSocket);

      expect(errorSpy).toHaveBeenCalledWith(testError);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleHostConnection', () => {
    it('should handle host connection with password', async () => {
      mockSocket.handshake.auth = {
        username: 'testhost',
        name: 'Test Room',
        password: '1234',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleHostConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'handleHostConnection',
        'testhost',
        'Test Room',
        '1234',
      );
      expect(socketService.onHostConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testhost',
        name: 'Test Room',
        password: 1234,
      });

      consoleSpy.mockRestore();
    });

    it('should handle host connection without password', async () => {
      mockSocket.handshake.auth = {
        username: 'testhost',
        name: 'Test Room',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleHostConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'handleHostConnection',
        'testhost',
        'Test Room',
        undefined,
      );
      expect(socketService.onHostConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testhost',
        name: 'Test Room',
        password: undefined,
      });

      consoleSpy.mockRestore();
    });

    it('should handle host connection with empty password', async () => {
      mockSocket.handshake.auth = {
        username: 'testhost',
        name: 'Test Room',
        password: '',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleHostConnection(mockSocket);

      expect(socketService.onHostConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testhost',
        name: 'Test Room',
        password: undefined,
      });

      consoleSpy.mockRestore();
    });

    it('should handle host connection with numeric password as string', async () => {
      mockSocket.handshake.auth = {
        username: 'testhost',
        name: 'Test Room',
        password: '5678',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleHostConnection(mockSocket);

      expect(socketService.onHostConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testhost',
        name: 'Test Room',
        password: 5678,
      });

      consoleSpy.mockRestore();
    });

    it('should handle host connection with special characters in username and room name', async () => {
      mockSocket.handshake.auth = {
        username: '한글사용자',
        name: '테스트 룸 🎮',
        password: '9999',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleHostConnection(mockSocket);

      expect(socketService.onHostConnection).toHaveBeenCalledWith(mockSocket, {
        username: '한글사용자',
        name: '테스트 룸 🎮',
        password: 9999,
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handlePeerConnection', () => {
    it('should handle peer connection with password', async () => {
      mockSocket.handshake.auth = {
        username: 'testpeer',
        roomId: '123',
        password: '1234',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handlePeerConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'handlePeerConnection',
        'testpeer',
        '123',
        '1234',
      );
      expect(socketService.onPeerConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testpeer',
        roomId: 123,
        password: 1234,
      });

      consoleSpy.mockRestore();
    });

    it('should handle peer connection without password', async () => {
      mockSocket.handshake.auth = {
        username: 'testpeer',
        roomId: '123',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handlePeerConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'handlePeerConnection',
        'testpeer',
        '123',
        undefined,
      );
      expect(socketService.onPeerConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testpeer',
        roomId: 123,
        password: undefined,
      });

      consoleSpy.mockRestore();
    });

    it('should handle peer connection with empty password', async () => {
      mockSocket.handshake.auth = {
        username: 'testpeer',
        roomId: '123',
        password: '',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handlePeerConnection(mockSocket);

      expect(socketService.onPeerConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testpeer',
        roomId: 123,
        password: undefined,
      });

      consoleSpy.mockRestore();
    });

    it('should convert roomId string to number', async () => {
      mockSocket.handshake.auth = {
        username: 'testpeer',
        roomId: '456',
        password: '7890',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handlePeerConnection(mockSocket);

      expect(socketService.onPeerConnection).toHaveBeenCalledWith(mockSocket, {
        username: 'testpeer',
        roomId: 456,
        password: 7890,
      });

      consoleSpy.mockRestore();
    });

    it('should handle peer connection with special characters in username', async () => {
      mockSocket.handshake.auth = {
        username: '한글피어',
        roomId: '789',
        password: '1111',
      };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handlePeerConnection(mockSocket);

      expect(socketService.onPeerConnection).toHaveBeenCalledWith(mockSocket, {
        username: '한글피어',
        roomId: 789,
        password: 1111,
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection and call socketService.onDisconnection', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleDisconnect(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} disconnected`);
      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle multiple disconnections', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleDisconnect(mockSocket);
      await gateway.handleDisconnect(mockSocket);

      expect(loggerSpy).toHaveBeenCalledTimes(2);
      expect(socketService.onDisconnection).toHaveBeenCalledTimes(2);
    });

    it('should handle disconnection error gracefully', async () => {
      const testError = new Error('Disconnection failed');
      socketService.onDisconnection.mockRejectedValue(testError);

      await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow(
        'Disconnection failed',
      );
      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
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
      expect(socketService.videoChanged).toHaveBeenCalledWith(
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
      await gateway.handleDisconnect(mockSocket);
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
      expect(socketService.videoChanged).toHaveBeenCalledWith(
        mockSocket,
        video,
      );

      // Test chat message
      await gateway.handleChat('test message', mockSocket);
      expect(socketService.chat).toHaveBeenCalledWith(
        mockSocket,
        'test message',
      );

      // Test kick message
      await gateway.handleRoomKick({ userId: 'test' }, mockSocket);
      expect(socketService.chkHost).toHaveBeenCalledWith(mockSocket);
      expect(socketService.kick).toHaveBeenCalledWith(mockSocket, 'test');
    });

    it('should handle connection and disconnection lifecycle', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      // Test disconnection
      await gateway.handleDisconnect(mockSocket);
      expect(loggerSpy).toHaveBeenCalledWith(`${mockSocket.id} disconnected`);
      expect(socketService.onDisconnection).toHaveBeenCalledWith(mockSocket);
    });
  });
});
