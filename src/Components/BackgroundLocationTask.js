/**
 * BackgroundLocationTask.js
 *
 * Android Headless JS task — executed by react-native-background-fetch
 * when the app process is NOT running (app fully closed / swiped away).
 *
 * This file MUST be registered in index.js (see comment at bottom).
 *
 * How it works:
 *  - Android wakes up a headless JS worker process
 *  - BackgroundFetch calls this task with the taskId
 *  - We read the officer ID from AsyncStorage and submit a ping
 *  - We MUST call BackgroundFetch.finish(taskId) within 30 seconds
 *
 * IMPORTANT: Register this in your index.js:
 *
 *   import BackgroundFetch from 'react-native-background-fetch';
 *   import BackgroundLocationTask from './src/services/BackgroundLocationTask';
 *   BackgroundFetch.registerHeadlessTask(BackgroundLocationTask);
 */

import BackgroundFetch from 'react-native-background-fetch';
import { performLocationPing } from './LocationService';

const BackgroundLocationTask = async (event) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout;

  console.log('[HeadlessTask] Received event. taskId:', taskId, 'timeout:', isTimeout);

  if (isTimeout) {
    // OS is telling us we've taken too long — finish immediately
    console.log('[HeadlessTask] Timeout received — calling finish');
    BackgroundFetch.finish(taskId);
    return;
  }

  try {
    await performLocationPing();
    console.log('[HeadlessTask] Ping complete');
  } catch (error) {
    console.error('[HeadlessTask] Ping failed:', error);
  } finally {
    // CRITICAL: always call finish within 30s or Android penalises the app
    BackgroundFetch.finish(taskId);
  }
};

export default BackgroundLocationTask;
