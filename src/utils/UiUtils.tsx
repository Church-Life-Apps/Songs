import { MINIMUM_SWIPE_DISTANCE, SWIPE_THRESHOLD, MINIMUM_SWIPE_VELOCITY } from "./StorageUtils";
import { isDesktop } from "./PlatformUtils";
import {
  createGesture,
  Gesture,
  GestureDetail,
} from "@ionic/react";

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

export function createSwipeGesture(currSongId: number, songBookLength: number, navToPrevSong: () => void, navToNextSong: () => void): void {
  // Don't create swipe gesture if on desktop
  if (isDesktop()) {
    return;
  }
  const gesture: Gesture = createGesture({

    el: document.getElementById("song-page-body") as Node,
    threshold: SWIPE_THRESHOLD,
    gestureName: "swipe-gesture",
    direction: "x",
    onEnd: (detail: GestureDetail) => {
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
}