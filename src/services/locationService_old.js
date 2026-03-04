import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_URL = 'https://testappapi.edelweissarc.in/api/v3/location'; // 🔁 Replace with your server URL

const INTERVAL_MINUTES = 15;          // 15 or 30 — your choice
const MAX_QUEUE_SIZE = 100;           // Max offline queue entries
const SEND_TIMEOUT_MS = 10000;        // 10 seconds HTTP timeout
const LOCATION_TIMEOUT_MS = 20000;   // 20 seconds GPS timeout

// ─── Main Task (called from both foreground and headless) ─────────────────────

/**
 * Core location task — gets GPS and sends to server
 * Called by BackgroundFetch callback AND headless task
 */
export const runBackgroundLocationTask = async () => {
  console.log('[LocationService] Running background location task...');

  try {
    // Load session data from storage
     const token = await AsyncStorage.getItem('authtoken');
    // if ( !token) {
    //   console.warn('[LocationService] No session found. Officer not logged in. Skipping.');
    //   return;
    // }

    // Get current GPS position
    const coords = await getCurrentLocation();
    console.log('[LocationService] Got coords:', coords.latitude, coords.longitude);

    // Build payload
    const payload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,        // meters
      altitude: coords.altitude,        // meters above sea level
      speed: coords.speed,              // m/s, null if unavailable
      heading: coords.heading,          // degrees, null if unavailable
      timestamp: new Date().toISOString(),
      source: 'background_auto',
      platform: 'android',              // you can use Platform.OS but Platform import may fail in headless
    };

    // Send to server (queues on failure)
    await sendLocationToServer(payload, token);

    // Retry any previously failed pings
    await flushPendingLocations(token);

  } catch (err) {
    console.error('[LocationService] Task error:', err.message);
  }
};

// ─── GPS ──────────────────────────────────────────────────────────────────────

/**
 * Gets current device GPS position
 * Returns coords object: { latitude, longitude, accuracy, altitude, speed, heading }
 */
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords);
      },
      (error) => {
        console.error('[Geolocation] Error code:', error.code, error.message);
        reject(new Error(`GPS Error ${error.code}: ${error.message}`));
      },
      {
        enableHighAccuracy: true,   // Use GPS chip (more accurate, more battery)
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: 0,              // Do not use cached location
      }
    );
  });
};

// ─── Server Communication ─────────────────────────────────────────────────────

/**
 * POST location payload to Node.js server
 * Queues to AsyncStorage if request fails (offline or server down)
 */
const sendLocationToServer = async (payload, token) => {
  try {
    const response = await axios.post(SERVER_URL, payload, {
      headers: {
        'Token': token,
        'Content-Type': 'application/json',
      },
      timeout: SEND_TIMEOUT_MS,
    });

    console.log(
      '[LocationService] ✅ Sent successfully:',
      payload.timestamp,
      '| Status:',
      response.status
    );
  } catch (err) {
    const status = err.response?.status;
    const message = err.message;
    console.warn(`[LocationService] ❌ Send failed (${status || message}). Queuing...`);
    await queueLocation(payload);
  }
};

// ─── Offline Queue ────────────────────────────────────────────────────────────

/**
 * Add a failed location ping to AsyncStorage queue
 */
const queueLocation = async (payload) => {
  try {
    const raw = await AsyncStorage.getItem('pendingLocations');
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(payload);

    // Prevent unbounded growth — keep most recent entries
    const capped = queue.length > MAX_QUEUE_SIZE
      ? queue.slice(queue.length - MAX_QUEUE_SIZE)
      : queue;

    await AsyncStorage.setItem('pendingLocations', JSON.stringify(capped));
    console.log(`[LocationService] Queued. Total pending: ${capped.length}`);
  } catch (err) {
    console.error('[LocationService] Queue error:', err.message);
  }
};

/**
 * Try to send all queued location pings
 * Call this when app comes online or on each background task
 */
export const flushPendingLocations = async (token) => {
  try {
    const raw = await AsyncStorage.getItem('pendingLocations');
    if (!raw) return;

    const queue = JSON.parse(raw);
    if (queue.length === 0) return;

    console.log(`[LocationService] Flushing ${queue.length} queued locations...`);

    const failed = [];

    for (const item of queue) {
      try {
        await axios.post(SERVER_URL, item, {
          headers: {
            'Token': token,
            'Content-Type': 'application/json',
          },
          timeout: SEND_TIMEOUT_MS,
        });
        console.log('[LocationService] ✅ Flushed queued item:', item.timestamp);
      } catch {
        failed.push(item); // Keep failed ones for next attempt
      }
    }

    await AsyncStorage.setItem('pendingLocations', JSON.stringify(failed));

    if (failed.length > 0) {
      console.warn(`[LocationService] ${failed.length} items still pending after flush.`);
    } else {
      console.log('[LocationService] ✅ All queued locations flushed.');
    }
  } catch (err) {
    console.error('[LocationService] Flush error:', err.message);
  }
};

// ─── Background Fetch Init ────────────────────────────────────────────────────

/**
 * Initialize background fetch
 * Call ONCE when officer logs in
 */
export const initLocationTracking = async () => {
  console.log('[LocationService] Initializing background location tracking...');

  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: INTERVAL_MINUTES,  // 15 or 30 minutes
      stopOnTerminate: false,    // ✅ Continue after app is killed
      startOnBoot: true,         // ✅ Resume after device reboot
      enableHeadless: true,      // ✅ Run headless task on Android when app is killed
      forceAlarmManager: true,   // ✅ Use AlarmManager for more reliable timing on Android
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
      requiresBatteryNotLow: false,
      requiresCharging: false,
      requiresDeviceIdle: false,
      requiresStorageNotLow: false,
    },

    // ── Called when app is alive (foreground or background) ──
    async (taskId) => {
      console.log('[BackgroundFetch] Task received (app alive):', taskId);
      await runBackgroundLocationTask();
      BackgroundFetch.finish(taskId); // ✅ MUST always call finish()
    },

    // ── Called if the task exceeds its time limit ──
    (taskId) => {
      console.warn('[BackgroundFetch] TIMEOUT for task:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  if (status === BackgroundFetch.STATUS_AVAILABLE) {
    console.log('[LocationService] ✅ Background fetch active.');
  } else if (status === BackgroundFetch.STATUS_DENIED) {
    console.warn('[LocationService] ❌ Background fetch denied by user/system.');
  } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
    console.warn('[LocationService] ❌ Background fetch restricted (parental controls).');
  }

  return status;
};

/**
 * Stop location tracking
 * Call when officer logs out
 */
export const stopLocationTracking = async () => {
  await BackgroundFetch.stop();
  console.log('[LocationService] 🛑 Location tracking stopped.');
};

/**
 * Manually trigger a single location ping
 * Use for "Check In" button or borrower visit event
 */
export const sendManualLocationPing = async (eventType = 'manual_checkin') => {
  try {
    const authToken = await AsyncStorage.getItem('authtoken');

    if ( !authToken) {
      throw new Error('Officer not logged in');
    }

    const coords = await getCurrentLocation();

    const payload = {
      
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      speed: coords.speed,
      heading: coords.heading,
      timestamp: new Date().toISOString(),
      source: eventType,   // 'manual_checkin', 'borrower_visit', 'call_initiated', etc.
    };

    await sendLocationToServer(payload, authToken);
    return { success: true, coords };
  } catch (err) {
    console.error('[LocationService] Manual ping error:', err.message);
    return { success: false, error: err.message };
  }
};