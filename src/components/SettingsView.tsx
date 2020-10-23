import { IonContent } from '@ionic/react';
import React from 'react';
import './Components.css';
import FeedbackForm from './FeedbackForm';

/**
 * Settings Page.
 */
const SettingsView: React.FC = () => {
  return (
    <IonContent>
      {/* TODO: Make settings page a List view with various things to choose from. */}

      <FeedbackForm />

    </IonContent>
  );
};

export default SettingsView;
