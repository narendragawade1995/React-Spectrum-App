import DeviceInfo from 'react-native-device-info';

export const checkDeviceSecurity = async () => {
  try {
    const devMode = await DeviceInfo.isDeveloperModeEnabled();

    if (devMode) {
      return { safe: false, reason: "Developer mode is ON" };
    } 
    return { safe: true };
  } catch (e) {
    return { safe: false, reason: "Security check failed" };
  }
};
