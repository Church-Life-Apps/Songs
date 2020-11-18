import {
    IonContent,
    IonPage,
    IonHeader,
  } from "@ionic/react";
  import { SongViewMode } from "../utils/SongUtils";
  import LyricView from "../components/LyricView";
  import MusicView from "../components/MusicView";
  import NavigationBar from "../components/NavigationBar";
  import React, { useState } from "react";
  import { useParams, useHistory } from "react-router-dom";
  
  /**
   * Song Page Component.
   *
   * Use 'useState' for dynamic variables.
   * When the variable changes, the places where it's being used are automatically re-rendered.
   */
  const SongPage: React.FC = () => {
    const { bookId, songId } = useParams();
    let history = useHistory();
  
    // when in song view, use music view or lyrics view
    const [songViewMode, setSongViewMode] = useState<SongViewMode>(
      SongViewMode.Music
    );
  
    return (
      <IonPage>
        <IonHeader>
          <NavigationBar
            backButtonOnClick={() => { history.push(`/${bookId}`) }}
            toggleSongModeOnClick={ToggleSongMode}
          />
        </IonHeader>
  
        <IonContent>
          {/* TODO: Add error handling in case of non number song Id */}
          <IonContent>{RenderSong(+songId)}</IonContent>
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
    }
  };
  
  export default SongPage;
  