import { IonContent, IonPage, IonHeader } from "@ionic/react";
import { SongViewMode } from "../utils/SongUtils";
import LyricView from "../components/LyricView";
import MusicView from "../components/MusicView";
import NavigationBar from "../components/NavigationBar";
import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
//Import Event tracking
import { Event } from "../components/Tracking";

/**
 * Song Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const SongPage: React.FC = () => {
  const { bookId, songId } = useParams<{ bookId: string; songId: string }>();
  let history = useHistory();

  // when in song view, use music view or lyrics view
  const [songViewMode, setSongViewMode] = useState<SongViewMode>(
    SongViewMode.Music
  );

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
        {RenderSong(+songId)}
      </IonContent>
    </IonPage>
  );

  function RenderSong(songNumber: number) {
    try {
      Event("INTERACTION", "Song is viewed", String(songNumber));
      console.log("Song number: "+String(songNumber)+" viewed");
    } catch (e) {
      console.error(e);
    }
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
};

export default SongPage;
