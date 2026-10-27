import React, { Dispatch, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Components.css";
import { getSongbookById, makeThreeDigits, Songbook, SongViewMode } from "../utils/SongUtils";
import { IonToggle } from "@ionic/react";
import { isDesktop } from "../utils/PlatformUtils";
//Import Event tracking
import { triggerSongView } from "../tracking/EventFunctions";
import { useParams } from "react-router";

const imageSuffix = ".png";
const alt = "No Song Found";

const songsWithTwoTunes = [156, 216, 278, 478];

// Two taps count as a double tap if they are this close together in time (ms) and space (px).
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 30;
// A touch only counts as a tap if the finger moved less than this (px) and lifted within this time (ms).
const TAP_MAX_MOVE = 10;
const TAP_MAX_MS = 400;

// Props are kind of like the parameters for the constructor of this class.
interface MusicViewProps {
  songNumber: number;
  setMusicPageUrl: Dispatch<SetStateAction<string>>;
  // Called when the music is enlarged or restored, so the song page can pause swiping while enlarged.
  onEnlargedChange?: (enlarged: boolean) => void;
}

interface TapInfo {
  x: number;
  y: number;
  time: number;
}

/**
 * Song Viewer React Functional Component.
 */
const MusicView: React.FC<MusicViewProps> = (props: MusicViewProps) => {
  const [secondTune, setSecondTune] = useState<boolean>(false);
  const [zoomed, setZoomed] = useState<boolean>(false);
  // Re-render on resize/rotation so the image width always matches the current screen.
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [songbook, setSongbook] = useState<Songbook>();
  const { bookId } = useParams<{ bookId: string }>();

  // Probably update this behavior later if other hymnals have songs with 2 tunes also.
  const songHasTwoTunes = songsWithTwoTunes.includes(props.songNumber) && bookId === "shl";
  const secondTuneSuffix = songHasTwoTunes && secondTune ? "-B" : "";

  const url = songbook?.musicUrl + makeThreeDigits(props.songNumber) + secondTuneSuffix + imageSuffix;
  useEffect(() => {
    props.setMusicPageUrl(url);
  });

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Music);
  }, [props.songNumber]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Tell the song page whether the music is enlarged. When this view goes away (for example
  // switching to lyrics), report "not enlarged" so swiping is never left paused.
  useEffect(() => {
    props.onEnlargedChange?.(zoomed);
  }, [zoomed]);
  useEffect(() => {
    return () => props.onEnlargedChange?.(false);
  }, []);

  // Double-tap detection for phones. iPhone Safari never sends a dblclick for two taps,
  // so we watch the touches ourselves.
  const touchStart = useRef<TapInfo | null>(null);
  const lastTap = useRef<TapInfo | null>(null);
  const multiTouch = useRef<boolean>(false);
  // Time of the last touch double tap, so the dblclick that Android sends right after is ignored.
  const lastTouchToggle = useRef<number>(0);

  const baseWidth = isDesktop() ? windowWidth / 2 : windowWidth;
  const width = zoomed ? baseWidth * 2 : baseWidth;

  // The spot the user double tapped, so it can stay under their finger after the size changes.
  const tapAnchor = useRef<{ clientX: number; clientY: number; fx: number; fy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function toggleZoom(tapX?: number, tapY?: number) {
    const img = imgRef.current;
    if (img && tapX !== undefined && tapY !== undefined) {
      const r = img.getBoundingClientRect();
      tapAnchor.current = {
        clientX: tapX,
        clientY: tapY,
        fx: (tapX - r.left) / r.width,
        fy: (tapY - r.top) / r.height,
      };
    }
    setZoomed(!zoomed);
  }

  // After the size changes, scroll so the tapped spot stays where the finger is.
  useLayoutEffect(() => {
    const anchor = tapAnchor.current;
    const img = imgRef.current;
    tapAnchor.current = null;
    if (!anchor || !img) {
      return;
    }
    const content = document.getElementById("song-page-body") as HTMLIonContentElement | null;
    content?.getScrollElement().then(scrollEl => {
      const r = img.getBoundingClientRect();
      scrollEl.scrollLeft += r.left + anchor.fx * r.width - anchor.clientX;
      scrollEl.scrollTop += r.top + anchor.fy * r.height - anchor.clientY;
    });
  }, [zoomed]);

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length > 1) {
      multiTouch.current = true;
      return;
    }
    multiTouch.current = false;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length > 1) {
      multiTouch.current = true;
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    if (multiTouch.current || e.touches.length > 0 || !start || !t) {
      // Part of a pinch or other multi-finger gesture: never a tap.
      lastTap.current = null;
      return;
    }
    const now = Date.now();
    const moved = Math.hypot(t.clientX - start.x, t.clientY - start.y);
    if (moved > TAP_MAX_MOVE || now - start.time > TAP_MAX_MS) {
      // A drag or long press, not a tap.
      lastTap.current = null;
      return;
    }
    const prev = lastTap.current;
    if (
      prev &&
      now - prev.time < DOUBLE_TAP_MS &&
      Math.hypot(t.clientX - prev.x, t.clientY - prev.y) < DOUBLE_TAP_DISTANCE
    ) {
      lastTap.current = null;
      lastTouchToggle.current = now;
      toggleZoom(t.clientX, t.clientY);
    } else {
      lastTap.current = { x: t.clientX, y: t.clientY, time: now };
    }
  }

  function onDoubleClick() {
    // Desktop mouse double click. Skip it if a touch double tap just handled this (Android sends both).
    if (Date.now() - lastTouchToggle.current < 1000) {
      return;
    }
    toggleZoom();
  }

  useEffect(() => {
    getSongbookById(bookId).then(book => {
      setSongbook(book);
    });
  }, [bookId]);

  return (
    <div>
      {/* Second Tune Toggler  */}
      {songHasTwoTunes && (
        <div id="songToggler">
          <IonToggle checked={secondTune} onIonChange={() => setSecondTune(!secondTune)} />
        </div>
      )}

      {/* image */}
      <img
        ref={imgRef}
        style={{ width: width }}
        id="musicView"
        // "enlarged" lifts the max-width cap so the image can be wider than the screen (see Components.css)
        // Desktop keeps its original look, where the enlarged image still fits the window.
        className={zoomed && !isDesktop() ? "song-page-center enlarged" : "song-page-center"}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        src={url}
        alt={alt}
      />
    </div>
  );
};

export default MusicView;
