import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { VideoService } from './video.service';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { Video, VidData } from '../room/entities/room.entity';
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
  });
}); 