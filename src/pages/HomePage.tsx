import { IonContent, IonPage, IonHeader, IonCard, IonList, IonCardTitle } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { defaultSongbooks, getSongbooks, Songbook } from "../utils/SongUtils";
import "./Pages.css"
/**
 * Home Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */

const HomePage: React.FC = () => {
  const history = useHistory();
  const [songbooks, setSongbooks] = useState<Songbook[]>(defaultSongbooks);

  useEffect(() => {
    getSongbooks().then((books) => {
      setSongbooks(books);
    });
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar />
      </IonHeader>

      <IonContent>
        {/* Redirect to book page until we add more book or make this page functional */}
        <IonList>{songbooks.map((it) => { return generateSongbookCard(it) })}</IonList>
      </IonContent>
    </IonPage>
  );


function generateSongbookCard(songbook: Songbook): JSX.Element {
  return (
    <IonCard
      key={songbook.name}
      onClick={() => {
        history.push(songbook.bookId);
      }}
      className="songbookCardView"
      id={songbook.bookId}
    >
      <IonCardTitle>
        {songbook.name}
      </IonCardTitle>
    </IonCard>
  );
}
};
export default HomePage;
