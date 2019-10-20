export type PeerInfo = {
  id: string;
  name?: string;
  avatar?: string;
  lastSeenAt?: number;
  lastMessage?: {
    id: string;
    text: string;
    receivedAt: number;
    readAt?: number;
  };
  isFriend: boolean;
}
