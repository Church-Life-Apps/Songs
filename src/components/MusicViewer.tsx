import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import "./Components.css";

// Marks the browser history entry added while the viewer is open, so the back button closes it.
const HISTORY_KEY = "musicViewerOpen";

interface MusicViewerProps {
  src: string;
  alt: string;
  // Natural size of the already loaded image, used to fit it to the screen.
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
}

/**
 * Full-screen sheet music viewer.
 *
 * Shows the music on a dark background. Pinch, drag, double tap, mouse wheel and trackpad zoom
 * move only the image, never the page. Close with the X, the back button or Escape.
 *
 * It is rendered at the end of <body>, outside the song page, so touches inside it never reach
 * the song page's swipe-to-change-song gesture.
 */
const MusicViewer: React.FC<MusicViewerProps> = (props: MusicViewerProps) => {
  const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState<number>(window.innerHeight);
  // Space kept clear above and below the music so the close button does not cover it at normal size.
  const [buttonSpace, setButtonSpace] = useState<number>(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Measured after layout because the button's position depends on the iPhone safe area.
  useLayoutEffect(() => {
    if (closeButtonRef.current) {
      setButtonSpace(closeButtonRef.current.getBoundingClientRect().bottom + 8);
    }
  }, [screenWidth, screenHeight]);

  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Back button and Escape close the viewer. A history entry with the same URL is added while
  // the viewer is open, so "back" closes the viewer instead of leaving the song.
  useEffect(() => {
    window.history.pushState({ [HISTORY_KEY]: true }, "");
    const onPopState = () => props.onClose();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
      // Closed with the X or Escape: remove the history entry added above.
      if (window.history.state && window.history.state[HISTORY_KEY]) {
        window.history.back();
      }
    };
  }, []);

  // Fit the whole page of music on the screen, leaving room above and below for the close button.
  const fit = Math.min(screenWidth / props.imageWidth, (screenHeight - 2 * buttonSpace) / props.imageHeight);

  return ReactDOM.createPortal(
    <div id="musicViewer" role="dialog" aria-modal="true" aria-label="Sheet music">
      <TransformWrapper centerOnInit doubleClick={{ mode: "toggle", step: 1 }}>
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <img
            id="musicViewerImage"
            src={props.src}
            alt={props.alt}
            style={{ width: props.imageWidth * fit, height: props.imageHeight * fit }}
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
      <button id="musicViewerClose" ref={closeButtonRef} type="button" aria-label="Close" onClick={props.onClose}>
        <IonIcon icon={closeOutline} />
      </button>
    </div>,
    document.body
  );
};

export default MusicViewer;
