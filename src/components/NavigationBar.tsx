import {
  IonButton,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonModal,
  IonIcon,
} from "@ionic/react";
import "./Components.css";
import {
  documentTextOutline,
  homeOutline,
  musicalNotesOutline,
  settingsOutline,
  swapHorizontalOutline,
} from "ionicons/icons";
import React, { useState } from "react";
import SettingsView from "../components/SettingsView";

interface NavigationBarProps {
  backButtonOnClick?: () => void;
  toggleSongModeOnClick?: () => void;
}

/**
 * Navigation Bar Component
 */
const NavigationBar: React.FC<NavigationBarProps> = (props) => {
  // whether or not to show settings modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    <IonToolbar>
      {/* [eric] we can probably come up with a better name, right? */}
      <IonTitle>Hymnal App</IonTitle>
      <IonButtons slot="start">{RenderBackButton()}</IonButtons>
      <IonButtons slot="primary">
        {RenderToggleSongModeButton()}
        {/* TODO: Put this Image/Lyric mode button into settings page. 
          This might require some react magic to get state from a child component */}
        <IonButton onClick={() => setShowSettingsModal(true)}>
          <IonIcon icon={settingsOutline} />
        </IonButton>
      </IonButtons>

      {/* Settings Menu Popup  */}
      <IonModal
        id="settingsModal"
        isOpen={showSettingsModal}
        onDidDismiss={() => setShowSettingsModal(false)}
      >
        <SettingsView />
        <IonButton
          id="returnToHymnalButton"
          onClick={() => setShowSettingsModal(false)}
        >
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
      <IonButton onClick={props.toggleSongModeOnClick}>
        <IonIcon icon={musicalNotesOutline} />
        <IonIcon icon={swapHorizontalOutline} />
        <IonIcon icon={documentTextOutline} />
      </IonButton>
    );
  }
};

export default NavigationBar;
