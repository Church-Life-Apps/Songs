import {
  IonContent,
  IonPage,
  IonItem,
  IonInput,
  IonButton,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonModal,
  IonLabel,
} from '@ionic/react';
import React, { useState } from 'react';
import LyricViewer from '../components/LyricViewer';
import SettingsView from '../components/SettingsView';
import SongViewer from '../components/SongViewer';
import './HomePage.css';
import settingsIcon from '../assets/icons/settings_icon.jpg';

/**
 * Home Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const HomePage: React.FC = () => {
  const [number, setNumber] = useState<number>(1);
  const [songVisibility, setSongVisibility] = useState<boolean>(false);
  const [lyricsOnlyMode, setLyricsOnlyMode] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="primary">
            {/* TODO: Put this Image/Lyric mode button into settings page. 
            This might require some react magic to get state from a child component */}
            <IonButton onClick={(e) => setLyricsOnlyMode(!lyricsOnlyMode)}>
              {!lyricsOnlyMode ? 'image mode' : 'lyric mode'}

            </IonButton>
            <img id="settingsButton" src={settingsIcon} onClick={() => setShowSettingsModal(true)} alt="Settings Button"></img>
          </IonButtons>

          <IonTitle>Hymnal App</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Settings Menu Popup  */}
        <IonModal id="settingsModal" isOpen={showSettingsModal} onDidDismiss={() => setShowSettingsModal(false)}>
          <SettingsView />
          <IonButton id="returnToHymnalButton" onClick={() => setShowSettingsModal(false)}>
            Back to Hymnal
          </IonButton>
        </IonModal>

        {/* Search Bar */}
        <IonItem>
          <IonLabel position="floating">Enter Number</IonLabel>
          <IonInput
            type="number"
            value={number}
            placeholder="Enter Number"
            onIonChange={(e) => setNumber(parseInt(e.detail.value!, 10))}
          ></IonInput>
        </IonItem>
        <IonButton onClick={(e) => setSongVisibility(!songVisibility)}>Show or Hide Song</IonButton>

        {/* Song will hide and show depending on the songVisibility boolean which is changed by the button click*/}
        {songVisibility ? (
          lyricsOnlyMode ? (
            <div id="lyricDiv">
              <LyricViewer songNumber={number} />
            </div>
          ) : (
            <div id="songDiv">
              <SongViewer songNumber={number} />
            </div>
          )
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
