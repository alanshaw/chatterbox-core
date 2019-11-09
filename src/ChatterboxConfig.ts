export type ChatterboxConfig = {
  repoDir: string;
  topics: {
    broadcast: string;
    beacon: string;
  };
  friendsMessageHistorySize: number;
  beaconInterval: number;
  peersPath: string;
};
