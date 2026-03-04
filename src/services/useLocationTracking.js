/**
 * useLocationTracking.js
 *
 * React hook that manages the full lifecycle of location tracking:
 *  - Requests permissions on first use
 *  - Starts tracking when the officer logs in
 *  - Exposes tracking status, permission state, and pending queue count
 *  - Handles permission denial gracefully with a user-friendly prompt
 *
 * Usage:
 *   const { trackingStatus, permissionGranted, startTracking, stopTracking } =
 *     useLocationTracking({ officerId: user.id, autoStart: true });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, {
  requestLocationPermissions,
  initLocationTracking,
  stopLocationTracking,
  isTrackingActive,
  getPendingQueueCount,
} from './LocationService';

export const TRACKING_STATUS = {
  IDLE: 'idle',
  REQUESTING_PERMISSION: 'requesting_permission',
  PERMISSION_DENIED: 'permission_denied',
  PERMISSION_PARTIAL: 'permission_partial', // foreground only, no background
  ACTIVE: 'active',
  STOPPING: 'stopping',
  ERROR: 'error',
};

const useLocationTracking = ({
  officerId,
  autoStart = true,          // start immediately when hook mounts
  onStatusChange = null,     // optional callback(status, detail)
  onPingSuccess = null,      // optional callback()
  onPingFail = null,         // optional callback(error)
} = {}) => {
  const [status, setStatus] = useState(TRACKING_STATUS.IDLE);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [backgroundPermission, setBackgroundPermission] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [error, setError] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);

  const updateStatus = useCallback(
    (newStatus, detail = null) => {
      if (!mountedRef.current) return;
      setStatus(newStatus);
      onStatusChange?.(newStatus, detail);
    },
    [onStatusChange]
  );

  // ── Refresh pending queue count ────────────────────────────────────────
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingQueueCount();
    if (mountedRef.current) setPendingCount(count);
  }, []);

  // ── Show permission denied alert with settings deep-link ───────────────
  const showPermissionAlert = useCallback((backgroundDenied = false) => {
    const title = backgroundDenied
      ? 'Background Location Required'
      : 'Location Permission Required';

    const message = backgroundDenied
      ? Platform.select({
          android:
            'To track field visits in the background, please go to:\n\nSettings → Apps → [App Name] → Permissions → Location → "Allow all the time"',
          ios:
            'To track field visits in the background, please go to:\n\nSettings → [App Name] → Location → "Always"',
        })
      : 'Location access is required to verify field visits. Please grant permission in Settings.';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ]);
  }, []);

  // ── Request permissions ────────────────────────────────────────────────
  const checkAndRequestPermissions = useCallback(async () => {
    updateStatus(TRACKING_STATUS.REQUESTING_PERMISSION);

    try {
      const result = await requestLocationPermissions();

      if (mountedRef.current) {
        setPermissionGranted(result.granted);
        setBackgroundPermission(result.background);
      }

      if (!result.granted) {
        updateStatus(TRACKING_STATUS.PERMISSION_DENIED);
        showPermissionAlert(false);
        return false;
      }

      if (!result.background) {
        updateStatus(TRACKING_STATUS.PERMISSION_PARTIAL);
        // Still start — will work when app is foregrounded; warn user
        showPermissionAlert(true);
        // Return true — we can still track in foreground
      }

      return true;
    } catch (e) {
      updateStatus(TRACKING_STATUS.ERROR, e.message);
      setError(e.message);
      return false;
    }
  }, [updateStatus, showPermissionAlert]);

  // ── Start tracking ─────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    // if (!officerId) {
    //   console.warn('[useLocationTracking] No officerId provided');
    //   return false;
    // }

    try {
      const hasPermission = await checkAndRequestPermissions();
      if (!hasPermission && status !== TRACKING_STATUS.PERMISSION_PARTIAL) {
        return false;
      }

      await initLocationTracking(officerId);
      updateStatus(TRACKING_STATUS.ACTIVE);
      setLastPingTime(new Date());
      await refreshPendingCount();
      onPingSuccess?.();
      return true;
    } catch (e) {
      console.error('[useLocationTracking] Failed to start:', e);
      updateStatus(TRACKING_STATUS.ERROR, e.message);
      setError(e.message);
      onPingFail?.(e);
      return false;
    }
  }, [officerId, checkAndRequestPermissions, updateStatus, refreshPendingCount, onPingSuccess, onPingFail, status]);

  // ── Stop tracking ──────────────────────────────────────────────────────
  const stopTracking = useCallback(async () => {
    updateStatus(TRACKING_STATUS.STOPPING);
    await stopLocationTracking();
    updateStatus(TRACKING_STATUS.IDLE);
  }, [updateStatus]);

  // ── Manual ping (for testing / on-demand) ─────────────────────────────
  const triggerManualPing = useCallback(async () => {
    try {
      await LocationService.ping(officerId);
      setLastPingTime(new Date());
      await refreshPendingCount();
      onPingSuccess?.();
    } catch (e) {
      onPingFail?.(e);
    }
  }, [officerId, refreshPendingCount, onPingSuccess, onPingFail]);

  // ── Auto-start on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (autoStart  ) {
      // Check if already active (e.g. app resumed after background)
      isTrackingActive().then((active) => {
        if (active) {
          updateStatus(TRACKING_STATUS.ACTIVE);
          refreshPendingCount();
        } else {
          startTracking();
        }
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional: only on mount

  // ── AppState listener: refresh pending count when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App came to foreground — refresh pending count
        refreshPendingCount();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refreshPendingCount]);

  return {
    // State
    trackingStatus: status,
    isActive: status === TRACKING_STATUS.ACTIVE,
    isLoading:
      status === TRACKING_STATUS.REQUESTING_PERMISSION ||
      status === TRACKING_STATUS.STOPPING,
    permissionGranted,
    backgroundPermission,
    pendingCount,      // number of pings queued offline
    lastPingTime,
    error,

    // Actions
    startTracking,
    stopTracking,
    triggerManualPing,
    refreshPendingCount,

    // Constants
    TRACKING_STATUS,
  };
};

export default useLocationTracking;
