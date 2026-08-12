import { LocationManager, type GeolocationPosition } from "@maplibre/maplibre-react-native";

export type OpenLocationPosition = GeolocationPosition;
export type OpenLocationListener = (position: OpenLocationPosition) => void;

export const openLocation = {
  requestPermissions: () => LocationManager.requestPermissions(),
  getCurrentPosition: () => LocationManager.getCurrentPosition(),
  setMinDisplacement: (meters: number) => LocationManager.setMinDisplacement(meters),
  addListener: (listener: OpenLocationListener) => LocationManager.addListener(listener),
  removeListener: (listener: OpenLocationListener) => LocationManager.removeListener(listener),
};
