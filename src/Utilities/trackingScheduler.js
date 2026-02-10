import { startTracking, stopTracking } from "./locationService";

export const scheduleTracking = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 7 && hour < 20) {
    startTracking();
  } else {
    stopTracking();
  }
};
