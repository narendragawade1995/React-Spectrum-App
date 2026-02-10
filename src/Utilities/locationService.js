import BackgroundGeolocation from 'react-native-background-geolocation';
import Api from './apiService';



export const startTracking = () => {
  BackgroundGeolocation.ready({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 50,
    stopOnTerminate: false,
    startOnBoot: true,
    locationUpdateInterval: 300000, // 5 min
    fastestLocationUpdateInterval: 300000,
    debug: false,
    logLevel: BackgroundGeolocation.LOG_LEVEL_OFF
  }, (state) => {
    if (!state.enabled) {
      BackgroundGeolocation.start();
    }
  });

  BackgroundGeolocation.onLocation(async (location) => {
    try {
    //   await fetch("https://your-api.com/location", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //       lat: location.coords.latitude,
    //       lng: location.coords.longitude,
    //       time: new Date(),
    //       mocked: location.coords.mocked
    //     })
    //   });

    const body = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          time: new Date(),
          mocked: location.coords.mocked
        }

    await Api.send(body,'user/tracking')

    } catch (e) {
      console.log("Location send error", e);
    }
  });
};

export const stopTracking = () => {
  BackgroundGeolocation.stop();
};