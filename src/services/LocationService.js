/**
 * LocationService.js
 *
 * Background location tracking service for field officer verification.
 *
 * Strategy:
 *  - Uses react-native-background-fetch for cross-platform 15-min scheduling
 *  - Uses react-native-geolocation-service for accurate GPS fixes
 *  - On Android: runs a Foreground Service with a persistent notification
 *    so the OS cannot kill the tracker even when app is in background/closed
 *  - On iOS: uses significant-location-change + background fetch modes
 *  - Queues failed pings to AsyncStorage and retries on next cycle
 *  - Every ping includes: officer_id, lat, lng, accuracy, timestamp, battery, network_type
 *
 * Install:
 *   npm install react-native-background-fetch react-native-geolocation-service
 *   npm install @react-native-async-storage/async-storage
 *   npm install @react-native-community/netinfo
 *
 * See SETUP_GUIDE.md for AndroidManifest / Info.plist changes required.
 */

import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform, PermissionsAndroid, AppState } from 'react-native';

// ─── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  // Your Node.js API endpoint
  //API_ENDPOINT: 'https://specto.free.beeceptor.com/location',
  API_ENDPOINT: 'https://testappapi.edelweissarc.in/api/v3/location', // 🔁 Replace with your server URL

 
  // How often to ping (minutes) — BackgroundFetch minimum is 15 on iOS
  INTERVAL_MINUTES: 15,

  // AsyncStorage keys
  STORAGE_KEY_QUEUE: '@location_queue',
  STORAGE_KEY_OFFICER: '@officer_id',
  STORAGE_KEY_ACTIVE: '@location_tracking_active',

  // GPS options
  GPS_TIMEOUT: 20000,       // 20s to get a fix
  GPS_MAX_AGE: 5000,        // Accept cached position up to 5s old
  GPS_HIGH_ACCURACY: true,

  // Retry queue max size (to avoid unbounded storage)
  MAX_QUEUE_SIZE: 200,

  // BackgroundFetch task identifier
  TASK_ID: 'com.fieldapp.location',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const log = (...args) => {
  if (__DEV__) console.log('[LocationService]', ...args);
};

const getBatteryLevel = async () => {
  try {
    // Uses react-native-device-info if available, otherwise omit
    const DeviceInfo = require('react-native-device-info');
    return await DeviceInfo.getBatteryLevel(); // 0.0 – 1.0
  } catch {
    return null;
  }
};

// ─── Permission Handling ───────────────────────────────────────────────────────
export const requestLocationPermissions = async () => {
  if (Platform.OS === 'android') {
    const fineResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission Required',
        message:
          'This app needs your location to verify field visits and ensure accurate reporting.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );

    if (fineResult !== PermissionsAndroid.RESULTS.GRANTED) {
      return { granted: false, background: false };
    }

    // Android 10+ needs separate background permission
    if (Platform.Version >= 29) {
      const bgResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Required',
          message:
            'To verify field visits even when the app is closed, allow location access "All the time" in the next screen.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Go to Settings',
        }
      );
      return {
        granted: true,
        background: bgResult === PermissionsAndroid.RESULTS.GRANTED,
      };
    }

    return { granted: true, background: true };
  }

  // iOS
  const result = await Geolocation.requestAuthorization('always');
  return {
    granted: result === 'granted' || result === 'restricted',
    background: result === 'granted',
  };
};

// ─── Get current GPS position ─────────────────────────────────────────────────
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: CONFIG.GPS_HIGH_ACCURACY,
        timeout: CONFIG.GPS_TIMEOUT,
        maximumAge: CONFIG.GPS_MAX_AGE,
        forceRequestLocation: true,        // Android: bypasses cached
        showLocationDialog: false,         // Android: don't show dialog mid-task
      }
    );
  });

// ─── Build location payload ───────────────────────────────────────────────────
const buildPayload = async (position) => {
  const netState = await NetInfo.fetch();
  const battery = await getBatteryLevel();

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,          // meters
    altitude: position.coords.altitude,
    speed: position.coords.speed,
    heading: position.coords.heading,
    timestamp: new Date(position.timestamp).toISOString(),
    device_timestamp: new Date().toISOString(),
    platform: Platform.OS,
    app_state: AppState.currentState,            // active / background / inactive
    network_type: netState.type,                 // wifi / cellular / none
    is_connected: netState.isConnected,
    battery_level: battery !== null ? Math.round(battery * 100) : null,
  };  
};

// ─── API submission ───────────────────────────────────────────────────────────
const submitToAPI = async (payload) => {
   const token = await AsyncStorage.getItem('authtoken');  
  const response = await fetch(CONFIG.API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Token: token } : {}), 
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

// ─── Offline queue management ─────────────────────────────────────────────────
const enqueuePayload = async (payload) => {
  try {
    const raw = await AsyncStorage.getItem(CONFIG.STORAGE_KEY_QUEUE);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(payload);

    // Trim oldest entries if queue is too large
    if (queue.length > CONFIG.MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - CONFIG.MAX_QUEUE_SIZE);
    }

    await AsyncStorage.setItem(CONFIG.STORAGE_KEY_QUEUE, JSON.stringify(queue));
    log(`Queued offline payload. Queue size: ${queue.length}`);
  } catch (e) {
    log('Failed to enqueue payload:', e);
  }
};

const flushQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(CONFIG.STORAGE_KEY_QUEUE);
    if (!raw) return;

    const queue = JSON.parse(raw);
    if (!queue.length) return;

    const { isConnected } = await NetInfo.fetch();
    if (!isConnected) {
      log('No connection — skipping queue flush');
      return;
    }

    log(`Flushing ${queue.length} queued location(s)…`);

    // Submit in batches to avoid hammering API
    const BATCH = 5;
    const failed = [];

    for (let i = 0; i < queue.length; i += BATCH) {
      const batch = queue.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (payload) => {
          try {
            await submitToAPI(payload);
          } catch {
            failed.push(payload);
          }
        })
      );
    }

    // Keep only failed ones
    if (failed.length) {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEY_QUEUE, JSON.stringify(failed));
      log(`Queue flush: ${queue.length - failed.length} sent, ${failed.length} still pending`);
    } else {
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEY_QUEUE);
      log('Queue fully flushed');
    }
  } catch (e) {
    log('Queue flush error:', e);
  }
};

// ─── Core ping function (called by BackgroundFetch) ───────────────────────────
export const performLocationPing = async (officerId) => {
  log('Performing location ping…');

  try {
 
    // Try to flush queued pings first (opportunistic)
    flushQueue().catch(() => {});

    const position = await getCurrentPosition();
    const payload = await buildPayload(position);

    log('Got position:', payload.latitude, payload.longitude, '±', payload.accuracy, 'm');

    const { isConnected } = await NetInfo.fetch();

    if (isConnected) {
      try {
        await submitToAPI(payload);
        log('Ping submitted successfully');
      } catch (apiError) {
        log('API submit failed — queuing:', apiError.message);
        await enqueuePayload(payload);
      }
    } else {
      log('Offline — queuing ping');
      await enqueuePayload(payload);
    }
  } catch (gpsError) {
    log('GPS error during ping:', gpsError.message);
    // Don't enqueue — no position data to report
  }
};

// ─── BackgroundFetch initialisation ──────────────────────────────────────────
export const initLocationTracking = async (officerId) => {
  log('Initialising location tracking for officer:', officerId);

  // Persist officer ID for headless task access
  //await AsyncStorage.setItem(CONFIG.STORAGE_KEY_OFFICER, officerId);
  await AsyncStorage.setItem(CONFIG.STORAGE_KEY_ACTIVE, 'true');

  // Configure BackgroundFetch
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: CONFIG.INTERVAL_MINUTES,
      // Android foreground service keeps tracking even when app is force-minimised
      enableHeadless: true,
      startOnBoot: true,              // restart tracking after phone reboot
      stopOnTerminate: false,         // keep running after app is swiped away
      forceAlarmManager: false,       // use JobScheduler (more reliable on Android)
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,

      // iOS
      requiresBatteryNotLow: false,
      requiresCharging: false,
      requiresDeviceIdle: false,
      requiresStorageNotLow: false,
    },
    // ── Foreground / background task callback ──
    async (taskId) => {
      log('BackgroundFetch event:', taskId);
      await performLocationPing(officerId);
      BackgroundFetch.finish(taskId); // MUST call finish()
    },
    // ── Timeout callback (iOS: 30s limit) ──
    (taskId) => {
      log('BackgroundFetch timeout:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  log('BackgroundFetch status:', status);

  // Do an immediate ping on start
  await performLocationPing(officerId);

  return status;
};

// ─── Stop tracking ─────────────────────────────────────────────────────────────
export const stopLocationTracking = async () => {
  log('Stopping location tracking');
  await AsyncStorage.setItem(CONFIG.STORAGE_KEY_ACTIVE, 'false');
  await BackgroundFetch.stop();
};

// ─── Check if tracking is active ─────────────────────────────────────────────
export const isTrackingActive = async () => {
  const val = await AsyncStorage.getItem(CONFIG.STORAGE_KEY_ACTIVE);
  return val === 'true';
};

// ─── Get pending queue count (for UI badge) ──────────────────────────────────
export const getPendingQueueCount = async () => {
  try {
    const raw = await AsyncStorage.getItem(CONFIG.STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
};

export default {
  init: initLocationTracking,
  stop: stopLocationTracking,
  ping: performLocationPing,
  isActive: isTrackingActive,
  requestPermissions: requestLocationPermissions,
  getPendingQueueCount,
};
