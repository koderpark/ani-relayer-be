import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { VideoService } from './video.service';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { Video, VidData } from '../interface';
import { mockUser } from '../user/entities/user.entity';

describe('VideoService', () => {
  let service: VideoService;
  let roomService: RoomService;
  let userService: UserService;

  // Mock Socket
  const mockSocket = {
    id: 'test-socket-id',
  } as Socket;

  // Mock Video data
  const mockVideo: Video = {
    title: 'Test Anime',
    episode: 'Episode 1',
    url: 'https://example.com/video.mp4',
    speed: 1.0,
    time: 120,
    isPaused: false,
  };

  // Mock VidData
  const mockVidData: VidData = {
    url: 'https://example.com/video.mp4',
    speed: 1.0,
    time: 120,
    isPaused: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: RoomService,
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            read: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    roomService = module.get<RoomService>(RoomService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should successfully update video when user is host', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const expectedUpdateData = {
        vidTitle: mockVideo.title,
        vidEpisode: mockVideo.episode,
        vidData: mockVidData,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      const result = await service.update(mockSocket, mockVideo);

      // Assert
      expect(userService.read).toHaveBeenCalledWith(mockSocket.id, ['host']);
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, expectedUpdateData);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException when user is not host', async () => {
      // Arrange
      const nonHostUser = { ...mockUser, host: null };
      jest.spyOn(userService, 'read').mockResolvedValue(nonHostUser);

      // Act & Assert
      await expect(service.update(mockSocket, mockVideo)).rejects.toThrow(
        new BadRequestException('not_host')
      );

      expect(userService.read).toHaveBeenCalledWith(mockSocket.id, ['host']);
      expect(roomService.update).not.toHaveBeenCalled();
    });

    it('should handle video with different properties correctly', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const customVideo: Video = {
        title: 'Custom Anime',
        episode: 'Episode 5',
        url: 'https://custom.com/video.mp4',
        speed: 1.5,
        time: 300,
        isPaused: true,
      };
      const expectedVidData: VidData = {
        url: 'https://custom.com/video.mp4',
        speed: 1.5,
        time: 300,
        isPaused: true,
      };
      const expectedUpdateData = {
        vidTitle: customVideo.title,
        vidEpisode: customVideo.episode,
        vidData: expectedVidData,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      const result = await service.update(mockSocket, customVideo);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, expectedUpdateData);
      expect(result).toBe(true);
    });

    it('should handle room service update failure', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(false);

      // Act
      const result = await service.update(mockSocket, mockVideo);

      // Assert
      expect(result).toBe(false);
      expect(roomService.update).toHaveBeenCalled();
    });

    it('should handle room service update throwing exception', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockRejectedValue(new Error('Room update failed'));

      // Act & Assert
      await expect(service.update(mockSocket, mockVideo)).rejects.toThrow('Room update failed');
    });

    it('should correctly map video properties to VidData', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const videoWithZeroValues: Video = {
        title: 'Zero Values Test',
        episode: 'Episode 0',
        url: '',
        speed: 0,
        time: 0,
        isPaused: true,
      };
      const expectedVidData: VidData = {
        url: '',
        speed: 0,
        time: 0,
        isPaused: true,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithZeroValues);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: videoWithZeroValues.title,
        vidEpisode: videoWithZeroValues.episode,
        vidData: expectedVidData,
      });
    });

    it('should handle video with null values', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const videoWithNullValues: Video = {
        title: null,
        episode: null,
        url: null,
        speed: null,
        time: null,
        isPaused: null,
      };
      const expectedVidData: VidData = {
        url: null,
        speed: null,
        time: null,
        isPaused: null,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithNullValues);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: null,
        vidEpisode: null,
        vidData: expectedVidData,
      });
    });

    it('should handle video with undefined values', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const videoWithUndefinedValues: Video = {
        title: undefined,
        episode: undefined,
        url: undefined,
        speed: undefined,
        time: undefined,
        isPaused: undefined,
      };
      const expectedVidData: VidData = {
        url: undefined,
        speed: undefined,
        time: undefined,
        isPaused: undefined,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithUndefinedValues);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: undefined,
        vidEpisode: undefined,
        vidData: expectedVidData,
      });
    });

    it('should handle user service read failure', async () => {
      // Arrange
      jest.spyOn(userService, 'read').mockRejectedValue(new Error('User service error'));

      // Act & Assert
      await expect(service.update(mockSocket, mockVideo)).rejects.toThrow('User service error');
      expect(roomService.update).not.toHaveBeenCalled();
    });

    it('should handle user service read throwing NotFoundException', async () => {
      // Arrange
      jest.spyOn(userService, 'read').mockRejectedValue(new Error('user_not_found'));

      // Act & Assert
      await expect(service.update(mockSocket, mockVideo)).rejects.toThrow('user_not_found');
      expect(roomService.update).not.toHaveBeenCalled();
    });

    it('should handle video with special characters in title and episode', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const videoWithSpecialChars: Video = {
        title: 'Anime Title with Special Chars: !@#$%^&*()',
        episode: 'Episode 1 - Part A & B',
        url: 'https://example.com/video with spaces.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };
      const expectedVidData: VidData = {
        url: 'https://example.com/video with spaces.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithSpecialChars);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: videoWithSpecialChars.title,
        vidEpisode: videoWithSpecialChars.episode,
        vidData: expectedVidData,
      });
    });

    it('should handle video with very long title and episode', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const longTitle = 'A'.repeat(1000);
      const longEpisode = 'B'.repeat(500);
      const videoWithLongValues: Video = {
        title: longTitle,
        episode: longEpisode,
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };
      const expectedVidData: VidData = {
        url: 'https://example.com/video.mp4',
        speed: 1.0,
        time: 120,
        isPaused: false,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithLongValues);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: longTitle,
        vidEpisode: longEpisode,
        vidData: expectedVidData,
      });
    });

    it('should handle video with extreme numeric values', async () => {
      // Arrange
      const hostUser = { ...mockUser, host: { id: 1 } } as any;
      const videoWithExtremeValues: Video = {
        title: 'Extreme Values Test',
        episode: 'Episode 999',
        url: 'https://example.com/video.mp4',
        speed: 999.99,
        time: 999999,
        isPaused: true,
      };
      const expectedVidData: VidData = {
        url: 'https://example.com/video.mp4',
        speed: 999.99,
        time: 999999,
        isPaused: true,
      };

      jest.spyOn(userService, 'read').mockResolvedValue(hostUser);
      jest.spyOn(roomService, 'update').mockResolvedValue(true);

      // Act
      await service.update(mockSocket, videoWithExtremeValues);

      // Assert
      expect(roomService.update).toHaveBeenCalledWith(mockSocket.id, {
        vidTitle: videoWithExtremeValues.title,
        vidEpisode: videoWithExtremeValues.episode,
        vidData: expectedVidData,
      });
    });
  });
}); 