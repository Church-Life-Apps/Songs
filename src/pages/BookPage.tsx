import { IonContent, IonPage, IonItem, IonHeader, IonSearchbar } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory } from "react-router-dom";
import { Song } from "../utils/SongUtils";
import { getShlSongs } from "../utils/StorageUtils";

/**
 * Book Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const BookPage: React.FC = () => {
  // the search string inputted by the user
  const [searchString, setSearchString] = useState<string>("");
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    getShlSongs()
      .then((song) => (song ? song : []))
      .then(setSongs);
  }, []);

  let history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar backButtonOnClick={() => history.push("/")} />
      </IonHeader>
      <IonItem>
        <IonSearchbar
          id="searchBar"
          type="search"
          value={searchString}
          placeholder="Search for a song"
          onIonChange={(e) => setSearchString(e.detail.value!.toString())}
        ></IonSearchbar>
      </IonItem>
      {/* The key here will trigger a re-initialization of a new searchView when it changes. */}
      <IonContent key={searchString}>
        <SearchView key={searchString + songs.length} searchString={searchString} songs={songs} />
      </IonContent>
    </IonPage>
  );
};

export default BookPage;
