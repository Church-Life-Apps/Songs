import { IonButton, IonTitle, IonToolbar, IonButtons, IonModal, IonIcon } from "@ionic/react";
import "./Components.css";
import {
  documentTextOutline,
  homeOutline,
  musicalNotesOutline,
  settingsOutline,
  swapHorizontalOutline,
  downloadOutline,
} from "ionicons/icons";
import React, { useEffect, useState } from "react";
import SettingsView from "../components/SettingsView";
import { useParams } from "react-router";
import { getSongbookById, SongViewMode } from "../utils/SongUtils";

interface NavigationBarProps {
  backButtonOnClick?: () => void;
  toggleSongModeOnClick?: () => void;
  songViewMode?: SongViewMode;
  musicPageUrl?: string;
}

export const defaultNavigationTitle = "Choose a Songbook!";

/**
 * Navigation Bar Component
 */
const NavigationBar: React.FC<NavigationBarProps> = (props) => {
  // whether or not to show settings modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [songbookName, setSongbookName] = useState<string>(defaultNavigationTitle);
  const { bookId } = useParams<{ bookId: string }>();
  const [songPageBlobUrl, setSongPageBlobUrl] = useState<string>('');

  useEffect(() => {
    getSongbookById(bookId).then((book) => {
      if (book) {
        setSongbookName(book.name);
      }
    });
  }, [bookId]);

  // The reason we need this is beacuse you cannot download things cross origin
  // but blob data is considered same origin, so here we fetch the image data and
  // create a blob url and set that blob url as the download link
  useEffect(() => {
    fetch(props.musicPageUrl as string)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        if (songPageBlobUrl !== blobUrl) {
          setSongPageBlobUrl(blobUrl)
        }
      })
      .catch(e => console.error(e));
  }, [props.musicPageUrl])

  return (
    <IonToolbar>
      <IonTitle id="appName">{songbookName}</IonTitle>
      <IonButtons slot="start">{RenderBackButton()}</IonButtons>
      <IonButtons slot="primary">
        {RenderToggleSongModeButton()}
        {props.songViewMode === SongViewMode.Music && RenderDownloadSheetMusicButton()}
        {/* TODO: Put this Image/Lyric mode button into settings page.
          This might require some react magic to get state from a child component */}
        <IonButton onClick={() => setShowSettingsModal(true)}>
          <IonIcon icon={settingsOutline} />
        </IonButton>
      </IonButtons>

      {/* Settings Menu Popup  */}
      <IonModal id="settingsModal" isOpen={showSettingsModal} onDidDismiss={() => setShowSettingsModal(false)}>
        <SettingsView />
        <IonButton id="returnToHymnalButton" onClick={() => setShowSettingsModal(false)}>
          Back to Hymnal
        </IonButton>
      </IonModal>
    </IonToolbar>
  );

  function RenderBackButton() {
    if (!props.backButtonOnClick) {
      return null;
    }

    return (
      <IonButton onClick={props.backButtonOnClick}>
        <IonIcon icon={homeOutline} />
      </IonButton>
    );
  }

  function RenderToggleSongModeButton() {
    if (!props.toggleSongModeOnClick) {
      return null;
    }

    return (
      <IonButton id="songViewToggler" onClick={props.toggleSongModeOnClick}>
        <IonIcon icon={musicalNotesOutline} />
        <IonIcon icon={swapHorizontalOutline} />
        <IonIcon icon={documentTextOutline} />
      </IonButton>

    );
  }

  function RenderDownloadSheetMusicButton() {
    return(
      <IonButton download="hymn" href={songPageBlobUrl}>
        <IonIcon icon={downloadOutline} />
      </IonButton>
    )
  }
};

export default NavigationBar;
