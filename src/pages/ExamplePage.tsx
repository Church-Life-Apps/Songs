import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
} from '@ionic/react';
import React from 'react';
import ExampleContainer from '../components/ExampleContainer';
import { Songs } from '../Songs';

// For learning purposes only. Once we have a legit page, delete this one.

const ExamplePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Example Home Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Example page. Modularize further by creating components. */}

        <IonItem>
            <IonLabel position="floating">Test Search Box</IonLabel>
            <IonInput />
        </IonItem>

        <ExampleContainer />

        <IonButton onClick={test}></IonButton> { /* test button */ }
      </IonContent>
    </IonPage>
  );
};

function test()
{
  console.log('test');
  let songs = new Songs();
}

export default ExamplePage;
