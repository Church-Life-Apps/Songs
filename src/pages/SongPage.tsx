import { IonIcon, 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonFab, 
  IonFabButton, 
  createGesture, 
  Gesture, 
  GestureDetail
} from "@ionic/react";
import { SongViewMode } from "../utils/SongUtils";
import { isBrowser } from "../utils/PlatformUtils";
import LyricView from "../components/LyricView";
import MusicView from "../components/MusicView";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { arrowBackCircleOutline, arrowForwardCircleOutline } from "ionicons/icons";
import { 
  MINIMUM_SWIPE_DISTANCE, 
  SWIPE_THRESHOLD, 
  MINIMUM_SWIPE_VELOCITY  
} from "../utils/StorageUtils";
//Import Event tracking
import { Event } from "../tracking/GoogleAnalytics";
import { getNumSongsForBookId } from "../service/SongsService";

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

  useEffect(() => {
    getNumSongsForBookId(bookId).then((size) => setSongBookLength(size));
  }, [bookId]);

  useEffect(() => {
    const gesture: Gesture = createGesture({
      el: document.getElementById('song-page-body') as Node,
      threshold: SWIPE_THRESHOLD,
      gestureName: 'swipe-gesture',
      direction: 'x',
      onEnd: (detail: GestureDetail) => { 
        if (Math.abs(detail.velocityX) > MINIMUM_SWIPE_VELOCITY) {
          if (detail.deltaX > MINIMUM_SWIPE_DISTANCE) {
            if (+songId < songBookLength) {
              history.push(`/${bookId}/${Math.max(+songId + 1, 1)}`);
            }
          } else {
            if (+songId > 1) {
              history.push(`/${bookId}/${Math.min(+songId - 1, songBookLength)}`);
            }
          }
        }
      }
    });
    gesture.enable();
  }, [songId, songBookLength])

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

      <IonContent id='song-page-body'>
        {/* TODO: Add error handling in case of non number song Id */}
        {isBrowser() && RenderPrevButton(+songId)}
        {RenderSong(+songId)}
        {isBrowser() && RenderNextButton(+songId)}
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
};

export default SongPage;
