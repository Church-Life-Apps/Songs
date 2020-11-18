import {
  IonContent,
  IonPage,
  IonHeader,
} from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { } from "react";
import { Redirect } from "react-router";

/**
 * Home Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const HomePage: React.FC = () => {
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
