import { getPlatforms, isPlatform } from "@ionic/react";

/**
 * Platform Utils:
 *
 * Android: Current platforms: android,cordova,capacitor,mobile,hybrid
 * iOS:
 * Chrome Mobile Mode: Current platforms: android,tablet,mobile,mobileweb
 * Chrome Regular Desktop: Current platforms: desktop
 */

/**
 * Returns true if this is app currently running on an iOS device.
 */
export function isIOS() {
  return isPlatform("ios");
}

/**
 * Returns true if this app is currently running on an Android device.
 */
export function isAndroid() {
  return isPlatform("android");
}

/**
 * Returns true if this app is currently running on the desktop.
 */
export function isBrowser() {
  return isPlatform("desktop");
}

/**
 * Returns true if the platform supports Cordova.
 *
 * * SQLite requires Cordova.
 */
export function isCordova() {
  return isPlatform("cordova");
}

export function logPlatforms() {
  console.log("Current platforms: " + getPlatforms());
}
