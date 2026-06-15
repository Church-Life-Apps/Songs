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
import { getSongbookById, SongViewMode } from "../utils/SongUtils";
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
  // create a blob url and we then use that blob url when we render the download button.
  //
  // #211: occasionally the fetch resolves to an HTML error/cache page instead of
  // the PNG, so the download saved a .html disguised as an image. We now
  // cache-bust the request and validate the response (ok + image content-type)
  // before creating a blob url; otherwise we surface an error and leave the
  // download button without a usable href.
  useEffect(() => {
    if (!props.musicPageUrl) {
      return;
    }

    let revoked = false;
    let createdBlobUrl: string | null = null;

    // Cache-bust so we don't get a stale/HTML cache entry from a CDN/service worker.
    const separator = props.musicPageUrl.includes("?") ? "&" : "?";
    const bustedUrl = `${props.musicPageUrl}${separator}_=${Date.now()}`;

    fetch(bustedUrl, { cache: "no-store" })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Sheet music request failed with status ${response.status}`);
        }
        const contentType = response.headers.get("content-type") || "";
        const blob = await response.blob();
        const blobType = blob.type || "";
        // Must be a real image (PNG). Reject HTML error/cache pages.
        const looksLikeImage =
          contentType.includes("image/png") ||
          contentType.includes("image/") ||
          blobType.includes("image/");
        const looksLikeHtml = contentType.includes("text/html") || blobType.includes("text/html");
        if (!looksLikeImage || looksLikeHtml) {
          throw new Error(`Sheet music response was not a valid image (content-type: ${contentType || blobType})`);
        }
        return blob;
      })
      .then(blob => {
        if (revoked) {
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        createdBlobUrl = blobUrl;
        setSongPageBlobUrl(blobUrl);
      })
      .catch(e => {
        console.error(e);
        // Fail gracefully: clear any stale blob url so we don't offer a bad download.
        if (!revoked) {
          setSongPageBlobUrl("");
        }
      });

    return () => {
      revoked = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
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
