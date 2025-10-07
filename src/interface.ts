export interface UserInfo {
  id: string;
  createdAt: Date;
  name: string;
  roomId: number | null;
  isHost: boolean;
}

export interface RoomInfo {
  id: number;
  name: string;
  host: string;
  user: {
    id: string;
    name: string;
    isHost: boolean;
  }[];
}

export interface VidData {
  url: string;
  speed: number;
  time: number;
  isPaused: boolean;
}

export interface Video {
  title: string;
  episode: string;
  url: string;
  speed: number;
  time: number;
  isPaused: boolean;
}

export interface PublicRoom {
  id: number;
  name: string;
  host: string; // username
  userCount: number; // count
  vidTitle: string;
  vidEpisode: string;
  isLocked: boolean;
  vidStartedAt: Date | null;
  vidLastUpdatedAt: Date | null;
}

export interface Chat {
  senderId: string;
  senderName: string;
  message: string;
};