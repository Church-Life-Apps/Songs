import { IonButton, IonContent, IonItem, IonLabel, IonList } from '@ionic/react';
import React, { useState } from 'react';
import './Components.css';
import FeedbackForm from './FeedbackForm';

/**
 * Settings Page.
 */
const SettingsView: React.FC = () => {
  const [chosenSetting, setChosenSetting] = useState<string>('');

  return (
    <IonContent>
      {/* To add another settings item, add another IonItem with an IonLabel. */}
      {/* TODO: Add Font Size as an option. */}
      {chosenSetting == '' ? (
        <IonList>
          <IonItem id="settingsTitle">
            <IonLabel>Settings</IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel onClick={() => setChosenSetting('feedback')}>Submit Feedback</IonLabel>
          </IonItem>
        </IonList>
      ) : null}

      {chosenSetting == 'feedback' ? <FeedbackForm /> : null}

      {chosenSetting != '' ? (
        <IonButton color="light" expand="full" id="backToSettingsButton" onClick={() => setChosenSetting('')}>
          Return to Settings
        </IonButton>
      ) : null}
    </IonContent>
  );
};

export default SettingsView;
