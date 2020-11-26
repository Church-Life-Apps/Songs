import {
  IonContent,
  IonPage,
  IonItem,
  IonHeader,
  IonSearchbar,
} from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory } from "react-router-dom";
<<<<<<< HEAD
import { BlackBookSongs } from "../utils/SongUtils";
=======
import { Song } from "../utils/SongUtils";
import { getShlSongs } from "../utils/StorageUtils";
>>>>>>> master

/**
 * Book Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const BookPage: React.FC = () => {
  // the search string inputted by the user
  const [searchString, setSearchString] = useState<string>("");
<<<<<<< HEAD
=======
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    getShlSongs()
      .then((song) => (song ? song : []))
      .then(setSongs);
  }, []);
>>>>>>> master

  let history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar backButtonOnClick={() => history.push("/")} />
      </IonHeader>
      <IonItem>
        <IonSearchbar
          type="search"
          value={searchString}
          placeholder="Search for a song"
          onIonChange={(e) => setSearchString(e.detail.value!.toString())}
        ></IonSearchbar>
      </IonItem>

      {/* The key here will trigger a re-initialization of a new searchView when it changes. */}
      <IonContent key={searchString}>
        <SearchView
          key={searchString + songs.length}
          searchString={searchString}
          songs={songs}
        />
      </IonContent>
    </IonPage>
  );
<<<<<<< HEAD

  function GetSearchBar() {
    return (
      <IonSearchbar
        type="search"
        value={searchString}
        placeholder="Search for a song"
        onIonChange={(e) => setSearchString(e.detail.value!.toString())}
      ></IonSearchbar>
    );
  }

  function GetSearchView() {
    return <SearchView key={searchString} searchString={searchString} songs={BlackBookSongs}/>;
  }
=======
>>>>>>> master
};

export default BookPage;
