export class RoomMem {
  userId: number[];
  vidTime: number;
  vidSpeed: number;
  vidIsPaused: boolean;

  addUser = (userId: number) => {
    this.userId.push(userId);
  };
}
