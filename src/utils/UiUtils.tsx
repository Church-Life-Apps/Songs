import { MINIMUM_SWIPE_DISTANCE, SWIPE_THRESHOLD, MINIMUM_SWIPE_VELOCITY } from "./StorageUtils";
import { isDesktop } from "./PlatformUtils";
import { createGesture, Gesture, GestureDetail } from "@ionic/react";

export function doElementsOverlap(element1: HTMLElement, element2: HTMLElement): boolean {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

/**
 * Returns true when the user has pinch-zoomed the page in (browser zoom, not our sheet-music enlarge).
 * Uses a small tolerance because some browsers report values like 1.0000001 at normal size.
 */
export function isPageZoomedIn(): boolean {
  return !!window.visualViewport && window.visualViewport.scale > 1.01;
}

/**
 * Sets up left/right swipe to change songs on touch devices.
 *
 * A swipe is ignored (so the song does NOT change) when:
 *  - the page is pinch-zoomed in, checked when the swipe starts and when it ends,
 *  - more than one finger touched the screen during the gesture (for example a pinch),
 *  - shouldIgnoreSwipe() returns true (for example while the sheet music is enlarged).
 *
 * Returns a cleanup function that removes the gesture and its listeners.
 */
export function createSwipeGesture(
  currSongId: number,
  songBookLength: number,
  navToPrevSong: () => void,
  navToNextSong: () => void,
  shouldIgnoreSwipe: () => boolean = () => false
): () => void {
  // Don't create swipe gesture if on desktop
  if (isDesktop()) {
    return () => undefined;
  }
  const el = document.getElementById("song-page-body");
  if (!el) {
    return () => undefined;
  }

  // Remember whether a second finger was used at any point during the current touch sequence.
  // Reset when a new sequence starts with a single finger.
  let multiTouchSeen = false;
  const trackTouches = (ev: TouchEvent) => {
    if (ev.type === "touchstart" && ev.touches.length === 1) {
      multiTouchSeen = false;
    }
    if (ev.touches.length > 1) {
      multiTouchSeen = true;
    }
  };
  const listenerOptions: AddEventListenerOptions = { capture: true, passive: true };
  el.addEventListener("touchstart", trackTouches, listenerOptions);
  el.addEventListener("touchmove", trackTouches, listenerOptions);

  const swipeIsBlocked = () => multiTouchSeen || isPageZoomedIn() || shouldIgnoreSwipe();

  const gesture: Gesture = createGesture({
    el: el,
    threshold: SWIPE_THRESHOLD,
    gestureName: "swipe-gesture",
    direction: "x",
    canStart: () => !swipeIsBlocked(),
    onEnd: (detail: GestureDetail) => {
      if (swipeIsBlocked()) {
        return;
      }
      if (Math.abs(detail.velocityX) > MINIMUM_SWIPE_VELOCITY) {
        if (detail.deltaX > MINIMUM_SWIPE_DISTANCE) {
          if (currSongId > 1) {
            navToPrevSong();
          }
        } else {
          if (currSongId < songBookLength) {
            navToNextSong();
          }
        }
      }
    },
  });
  gesture.enable();

  return () => {
    gesture.destroy();
    el.removeEventListener("touchstart", trackTouches, listenerOptions);
    el.removeEventListener("touchmove", trackTouches, listenerOptions);
  };
}
