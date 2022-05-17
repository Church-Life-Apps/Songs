import {
  IonIcon,
  IonContent,
  IonPage,
  IonHeader,
  IonFab,
  IonFabButton,
  createGesture,
  Gesture,
  GestureDetail,
} from "@ionic/react";
import { SongViewMode } from "../utils/SongUtils";
import { isDesktop } from "../utils/PlatformUtils";
import LyricView from "../components/LyricView";
import MusicView from "../components/MusicView";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { arrowBackCircleOutline, arrowForwardCircleOutline } from "ionicons/icons";
import { MINIMUM_SWIPE_DISTANCE, SWIPE_THRESHOLD, MINIMUM_SWIPE_VELOCITY } from "../utils/StorageUtils";

//Import Event tracking
import { Event } from "../tracking/GoogleAnalytics";
import { getNumSongsForBookId } from "../service/SongsService";
// Import utils
import { doElementsOverlap } from "../utils/UiUtils";
/**
 * Song Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const SongPage: React.FC = () => {
  const { bookId, songId } = useParams<{ bookId: string; songId: string }>();
  const history = useHistory();
  // when in song view, use music view or lyrics view
  const [songViewMode, setSongViewMode] = useState<SongViewMode>(SongViewMode.Lyrics);
  const [songBookLength, setSongBookLength] = useState<number>(0);
  // current song id converted to number
  const currSongId: number = +songId;

  useEffect(() => {
    getNumSongsForBookId(bookId).then((size) => setSongBookLength(size));

    window.addEventListener("resize", ToggleNavButtonListeners);
    return () => {
      window.removeEventListener("resize", ToggleNavButtonListeners);
    };
  }, [bookId]);

  useEffect(() => {
    if (isDesktop()) {
      return;
    }
    const gesture: Gesture = createGesture({
      el: document.getElementById("song-page-body") as Node,
      threshold: SWIPE_THRESHOLD,
      gestureName: "swipe-gesture",
      direction: "x",
      onEnd: (detail: GestureDetail) => {
        console.log(detail);
        if (Math.abs(detail.velocityX) > MINIMUM_SWIPE_VELOCITY) {
          if (detail.deltaX > MINIMUM_SWIPE_DISTANCE) {
            if (currSongId < songBookLength) {
              history.push(`/${bookId}/${Math.min(currSongId - 1, songBookLength)}`);
            }
          } else {
            if (currSongId > 1) {
              history.push(`/${bookId}/${Math.max(currSongId + 1, 1)}`);
            }
          }
        }
      },
    });
    gesture.enable();
  }, [songId, songBookLength]);

  useEffect(() => {
    // want to give it enough time before running the button hiding/showing function
    // if we run it too soon, the buttons won't be in the dom yet
    setTimeout(ToggleNavButtonListeners, 1000);
  }, [songViewMode]);

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar
          backButtonOnClick={() => {
            history.push(`/${bookId}`);
          }}
          toggleSongModeOnClick={ToggleSongMode}
        />
      </IonHeader>

      <IonContent id="song-page-body">
        {/* TODO: Add error handling in case of non number song Id */}
        {isDesktop() && RenderPrevButton(currSongId)}
        {RenderSong(currSongId)}
        {isDesktop() && RenderNextButton(currSongId)}
      </IonContent>
    </IonPage>
  );

  function RenderSong(songNumber: number) {
    if (songViewMode === SongViewMode.Music) {
      return <MusicView songNumber={songNumber} />;
    } else {
      return <LyricView songNumber={songNumber} />;
    }
  }

  function ToggleSongMode() {
    if (songViewMode === SongViewMode.Music) {
      setSongViewMode(SongViewMode.Lyrics);
    } else {
      setSongViewMode(SongViewMode.Music);
    }
    try {
      Event("INTERACTION", "Songmode is toggled", "SongMode_Toggle");
    } catch (e) {
      console.error(e);
    }
  }

  function RenderPrevButton(songNumber: number) {
    if (songNumber > 1) {
      return (
        <IonFab id="prevButton" vertical="center" horizontal="start" slot="fixed">
          <IonFabButton
            color="medium"
            onClick={() => {
              history.push(`/${bookId}/${Math.min(songNumber - 1, songBookLength)}`);
            }}
          >
            <IonIcon class="pageTurnButton" icon={arrowBackCircleOutline} />
          </IonFabButton>
        </IonFab>
      );
    }
  }

  function RenderNextButton(songNumber: number) {
    if (songNumber < songBookLength) {
      return (
        <IonFab id="nextButton" vertical="center" horizontal="end" slot="fixed">
          <IonFabButton
            color="medium"
            onClick={() => {
              history.push(`/${bookId}/${Math.max(songNumber + 1, 1)}`);
            }}
          >
            <IonIcon class="pageTurnButton" icon={arrowForwardCircleOutline} />
          </IonFabButton>
        </IonFab>
      );
    }
  }

  function ToggleNavButtonListeners() {
    const prevButtonElement = document.querySelector("#prevButton") as HTMLElement;
    const nextButtonElement = document.querySelector("#nextButton") as HTMLElement;
    const songPageCenterElement = document.querySelector(".song-page-center") as HTMLElement;

    if (prevButtonElement) {
      prevButtonElement.style.visibility = doElementsOverlap(prevButtonElement, songPageCenterElement)
        ? "hidden"
        : "visible";
    }
    if (nextButtonElement) {
      nextButtonElement.style.visibility = doElementsOverlap(nextButtonElement, songPageCenterElement)
        ? "hidden"
        : "visible";
    }
  }
};

export default SongPage;
