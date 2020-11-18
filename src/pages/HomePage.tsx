import {
  IonContent,
  IonPage,
  IonButton,
  IonHeader,
  IonModal,
} from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useState } from "react";
import SettingsView from "../components/SettingsView";
import { Redirect } from "react-router";

/**
 * Home Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const HomePage: React.FC = () => {
  // whether or not to show settings modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar />
      </IonHeader>

      <IonContent>
        {/* Redirect to book page until we add more book or make this page functional */}
        <Redirect to="SongsOfLife" />

        <IonContent></IonContent>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
