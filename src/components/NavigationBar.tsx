import { IonButton, IonToolbar, IonButtons, IonModal, IonIcon, IonText } from "@ionic/react";
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
import { getSongbookById, isFetchableUrl, isImageResponse, SongViewMode } from "../utils/SongUtils";
import { isDesktop, isMobileWeb } from "../utils/PlatformUtils";

interface NavigationBarProps {
  backButtonOnClick?: () => void;
  toggleSongModeOnClick?: () => void;
  songViewMode?: SongViewMode;
  musicPageUrl?: string;
  songDownloadName?: string;
}

export const defaultNavigationTitle = "Choose a Songbook!";

/**
 * Navigation Bar Component
 */
const NavigationBar: React.FC<NavigationBarProps> = props => {
  // whether or not to show settings modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [songbookName, setSongbookName] = useState<string>(defaultNavigationTitle);
  const { bookId } = useParams<{ bookId: string }>();
  const [songPageBlobUrl, setSongPageBlobUrl] = useState<string>("");

  useEffect(() => {
    getSongbookById(bookId).then(book => {
      if (book) {
        setSongbookName(book.name);
      }
    });
  }, [bookId]);

  // The reason we need this is beacuse you cannot download things cross origin
  // but blob data is considered same origin, so here we fetch the image data and
  // create a blob url and we then use that blob url when we render the download button
  useEffect(() => {
    // Only fetch when a real music URL is present. On pages without sheet music
    // (e.g. the home page) props.musicPageUrl is undefined; passing that to fetch()
    // would request "/undefined" and 404. See isFetchableUrl.
    if (!isFetchableUrl(props.musicPageUrl)) {
      setSongPageBlobUrl("");
      return;
    }
    let cancelled = false;
    fetch(props.musicPageUrl)
      .then(response => {
        // Guard #211: do NOT turn a non-image response (e.g. a 404 HTML error
        // page) into a blob. If we did, the download button would serve that
        // HTML as "<book>_<n>.html" instead of the PNG sheet music. Only build a
        // blob URL when the response is an actual image.
        if (!isImageResponse(response)) {
          throw new Error(
            `Sheet music fetch did not return an image (status ${response.status}, ` +
              `content-type ${response.headers.get("content-type") || "unknown"}) for ${props.musicPageUrl}`
          );
        }
        return response.blob();
      })
      .then(blob => {
        if (cancelled) {
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        setSongPageBlobUrl(prev => {
          if (prev.startsWith("blob:") && prev !== blobUrl) {
            URL.revokeObjectURL(prev);
          }
          return blobUrl;
        });
      })
      .catch(e => {
        // On any failure (network error or non-image response) clear the href so
        // the button never points at stale or HTML content.
        if (!cancelled) {
          setSongPageBlobUrl("");
        }
        console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, [props.musicPageUrl]);

  return (
    <IonToolbar style={{}}>
      <IonButtons slot="start">{RenderBackButton()}</IonButtons>
      <IonText
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          width: "100%",
          textOverflow: "ellipsis",
          display: "block",
          fontSize: "20px",
          marginLeft: "4px",
          fontWeight: "bold",
        }}
        id="appName"
      >
        {`${songbookName}`}
      </IonText>
      <IonButtons slot="end">
        {(isDesktop() || isMobileWeb()) &&
          props.songViewMode === SongViewMode.Music &&
          RenderDownloadSheetMusicButton()}
        {RenderToggleSongModeButton()}

        {/* TODO: Put this Image/Lyric mode button into settings page.
          This might require some react magic to get state from a child component */}
        <IonButton slot="end" onClick={() => setShowSettingsModal(true)}>
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
      <IonButton slot="end" id="songViewToggler" onClick={props.toggleSongModeOnClick}>
        <IonIcon icon={musicalNotesOutline} />
        <IonIcon icon={swapHorizontalOutline} />
        <IonIcon icon={documentTextOutline} />
      </IonButton>
    );
  }

  function RenderDownloadSheetMusicButton() {
    return (
      <IonButton slot="end" id="music-download-button" download={props.songDownloadName} href={songPageBlobUrl}>
        <IonIcon icon={downloadOutline} />
      </IonButton>
    );
  }
};

export default NavigationBar;
