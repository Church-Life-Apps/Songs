import { IonIcon, IonContent, IonPage, IonHeader, IonFab, IonFabButton } from "@ionic/react";
import { SongViewMode } from "../utils/SongUtils";
import { isBrowser } from "../utils/PlatformUtils";
import LyricView from "../components/LyricView";
import MusicView from "../components/MusicView";
import NavigationBar from "../components/NavigationBar";
import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { arrowBackCircleOutline, arrowForwardCircleOutline } from "ionicons/icons";
//Import Event tracking
import { Event } from "../tracking/GoogleAnalytics";

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

      <IonContent>
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
        <IonFab vertical="center" horizontal="start" slot="fixed">
          <IonFabButton
            color="medium"
            onClick={() => {
              history.push(`/${bookId}/${songNumber - 1}`);
            }}
          >
            <IonIcon class="pageTurnButton" icon={arrowBackCircleOutline} />
          </IonFabButton>
        </IonFab>
      );
    }
  }

  function RenderNextButton(songNumber: number) {
    // idk how to get total number of songs so its hard coded for shl for now
    if (songNumber < 533) {
      return (
        <IonFab vertical="center" horizontal="end" slot="fixed">
          <IonFabButton
            color="medium"
            onClick={() => {
              history.push(`/${bookId}/${songNumber + 1}`);
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
