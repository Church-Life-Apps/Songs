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
  IonIcon,
} from '@ionic/react';
import React, { useState } from 'react';
import LyricViewer from '../components/LyricViewer';
import SongViewer from '../components/SongViewer';
import './HomePage.css';

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="primary">
            <IonButton onClick={(e) => setLyricsOnlyMode(!lyricsOnlyMode)}>
              {!lyricsOnlyMode ? 'image mode' : 'lyric mode'}
            </IonButton>
          </IonButtons>
          <IonTitle>Hymnal App</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonItem>
          <IonInput
            type="number"
            value={number}
            placeholder="Enter Number"
            onIonChange={(e) => setNumber(parseInt(e.detail.value!, 10))}
          ></IonInput>
        </IonItem>
        <IonButton onClick={(e) => setSongVisibility(!songVisibility)}>Show or Hide Song</IonButton>

        {/* Song will hide and show depending on the songVisibiliy boolean which is changed by the button click*/}
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
