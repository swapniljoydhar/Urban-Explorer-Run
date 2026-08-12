export type OpenLocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  timestamp: number;
};

export type OpenLocationListener = (position: OpenLocationPosition) => void;

export const openLocation = {
  requestPermissions: async () => false,
  getCurrentPosition: async (): Promise<OpenLocationPosition | undefined> => undefined,
  setMinDisplacement: (_meters: number) => undefined,
  addListener: (_listener: OpenLocationListener) => undefined,
  removeListener: (_listener: OpenLocationListener) => undefined,
};
