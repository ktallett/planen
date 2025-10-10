import { useState, useEffect } from 'react';

const CURRENT_VERSION = '0.1.0';
const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const VERSION_URL = '/version.json'; // For web app deployed on GitHub Pages

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri
    const checkTauri = async () => {
      if (typeof window !== 'undefined' && window.__TAURI__) {
        setIsTauri(true);
        await checkTauriUpdate();
      } else {
        // Web app update check
        checkWebUpdate();

        // Set up periodic checks
        const interval = setInterval(checkWebUpdate, VERSION_CHECK_INTERVAL);
        return () => clearInterval(interval);
      }
    };

    checkTauri();
  }, []);

  const checkWebUpdate = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`${VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) return;

      const data = await response.json();

      if (data.version && data.version !== CURRENT_VERSION) {
        setNewVersion(data.version);
        setUpdateAvailable(true);
      }
    } catch (error) {
      // Silently fail - don't bother users with update check errors
      console.debug('Update check failed:', error);
    }
  };

  const checkTauriUpdate = async () => {
    try {
      // Only import Tauri modules if we're actually in a Tauri environment
      if (!window.__TAURI__) return;

      const { check } = window.__TAURI__.updater;
      const { relaunch } = window.__TAURI__.process;

      const update = await check();

      if (update?.available) {
        setNewVersion(update.version);
        setUpdateAvailable(true);

        // Auto-download and install
        const shouldUpdate = confirm(
          `A new version ${update.version} is available!\n\n` +
          `Current version: ${CURRENT_VERSION}\n\n` +
          `Would you like to update now? The app will restart after updating.`
        );

        if (shouldUpdate) {
          await update.downloadAndInstall();
          await relaunch();
        }
      }
    } catch (error) {
      console.debug('Tauri update check failed:', error);
    }
  };

  const refreshApp = () => {
    if (isTauri) {
      checkTauriUpdate();
    } else {
      // For web app, reload the page to get the new version
      window.location.reload(true);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    newVersion,
    currentVersion: CURRENT_VERSION,
    isTauri,
    refreshApp,
    dismissUpdate,
  };
}
