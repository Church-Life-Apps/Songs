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
export function isIOS(): boolean {
  return isPlatform("ios");
}

/**
 * Returns true if this app is currently running on an Android device.
 */
export function isAndroid(): boolean {
  return isPlatform("android");
}

/**
 * Returns true if this app is currently running on a desktop device.
 */
export function isDesktop(): boolean {
  return isPlatform("desktop");
}

/**
 * Returns true if this app is currently running on a mobile device.
 */
export function isMobile(): boolean {
  return isPlatform("mobile");
}

/**
 * Returns true if this app is currently on a web browser running in a mobile device.
 */
export function isMobileWeb(): boolean {
  return isPlatform("mobileweb");
}

/**
 * Returns true if this app is currently running on a tablet device.
 */
export function istablet(): boolean {
  return isPlatform("tablet");
}

/**
 * Returns true if the platform supports Cordova.
 *
 * * SQLite requires Cordova.
 */
export function isCordova(): boolean {
  return isPlatform("cordova");
}

export function logPlatforms(): void {
  console.debug("Current platforms: " + getPlatforms());
}
