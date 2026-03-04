import {
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';

/**
 * Request foreground + background location permissions
 * Must be called before starting location tracking
 */
export const requestLocationPermissions = async () => {
  // iOS — permissions are shown automatically when Geolocation is first called
  // Info.plist descriptions handle the text shown to user
  if (Platform.OS === 'ios') {
    return true;
  }

  // ── Android ──────────────────────────────────────────────────────────────

  // Step 1: Request FINE location
  const fineGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission Required',
      message:
        'This app needs your location to verify that you visit borrowers at their addresses.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );

  if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert(
      'Location Permission Denied',
      'Location access is required to use this app. Please enable it in Settings.',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    return false;
  }

  // Step 2: Android 10+ (API 29+) requires a separate prompt for background location
  // You MUST request fine location first before requesting background
  if (Platform.Version >= 29) {
    const backgroundGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Background Location Required',
        message:
          'To verify field visits when the app is closed, please choose ' +
          '"Allow all the time" on the next screen.',
        buttonPositive: 'Open Settings',
      }
    );

    if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Background Location Denied',
        'Background location is needed to log visits when app is closed. ' +
          'Please enable "Allow all the time" in Settings.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }
  }

  return true;
};

/**
 * Check and prompt to disable battery optimization on Android
 * This is critical on Chinese OEM devices (Xiaomi, OPPO, Vivo, Realme)
 */
export const requestBatteryOptimizationExemption = async () => {
  if (Platform.OS !== 'android') return;

  try {
    const {
      checkBatteryOptimizationEnabled,
      openBatteryOptimizationSettings,
    } = require('react-native-battery-optimization-check');

    const isOptimized = await checkBatteryOptimizationEnabled();

    if (isOptimized) {
      Alert.alert(
        'Battery Optimization Detected',
        'For accurate visit tracking, please disable battery optimization for this app. ' +
          'Tap "Open Settings" and select "Don\'t optimize" or "Unrestricted".',
        [
          {
            text: 'Open Settings',
            onPress: () => openBatteryOptimizationSettings(),
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    }
  } catch (e) {
    console.warn('[Battery Check] Library not available:', e.message);
  }
};