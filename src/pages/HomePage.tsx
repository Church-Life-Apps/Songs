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
import SearchView from '../components/SearchView';
import { render } from '@testing-library/react';
import { forceUpdate } from 'ionicons/dist/types/stencil-public-runtime';

/**
 * Home Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const HomePage: React.FC = () => {
  const [songNumber, setSongNumber] = useState<number>(0);
  const [visibleViewer, setVisibleViewer] = useState<string>("search");
  const [lyricsOnlyMode, setLyricsOnlyMode] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // const searchView = SearchView({});
  // const lyricViewer = LyricViewer({songNumber: 0});
  // const songViewer = SongViewer({songNumber: 0});

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
        {/* <IonItem>
          <IonLabel position="floating">Enter Number</IonLabel>
          <IonInput
            type="number"
            value={number}
            placeholder="Enter Number"
            onIonChange={(e) => setNumber(parseInt(e.detail.value!, 10))}
          ></IonInput>
        </IonItem> */}
        {/* <IonButton onClick={(e) => setVisibleViewer(!visibleViewer)}>Show or Hide Song</IonButton> */}

        {/* Song will hide and show depending on the visibleViewer boolean which is changed by the button click*/}
        {/* {visibleViewer ? (
          lyricsOnlyMode ? (
            <div id="lyricDiv">
              <LyricViewer songNumber={number} />
            </div>
          ) : (
            <div id="songDiv">
              <SongViewer songNumber={number} />
            </div>
          )
        ) : null} */}
        {GetViewer(visibleViewer, songNumber, lyricsOnlyMode)}

      </IonContent>
    </IonPage>
  );

  function GetViewer(viewer: string, songNumber: number, lyricsOnlymode: boolean)
  {
    switch(viewer)
    {
      case "search":
        return <SearchView setSongNumber={setSongNumber} setVisibleViewer={setVisibleViewer} lyricsOnlyMode={lyricsOnlyMode}/>

      case "songs":
        return <SongViewer songNumber={songNumber} />

      case "lyrics":
        return <LyricViewer songNumber={songNumber}/>
    }
  }
};

export default HomePage;
