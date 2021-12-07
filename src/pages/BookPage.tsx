import { IonContent, IonPage, IonHeader, IonInput, IonItem } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory, useParams } from "react-router-dom";
import { Song } from "../utils/SongUtils";
import { listSongs } from "../service/SongsService";

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
  const { bookId } = useParams<{ bookId: string }>();

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      listSongs(searchString, bookId)
        .then((songs) => {
          setSongs(songs);
        })
        .catch((e) => console.error(e));
    }, 200);
    return () => clearTimeout(timeOutId);
  }, [searchString]);

  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar backButtonOnClick={() => history.push("/")} />
      </IonHeader>
      <IonItem>
        <IonInput
          id="searchBar"
          type="search"
          value={searchString}
          placeholder="Search for a song"
          onIonChange={(word) => setSearchString(word.detail.value as string)}
        ></IonInput>
      </IonItem>
      {/* The key here will trigger a re-initialization of a new searchView when it changes. */}
      <IonContent>
        <SearchView key={searchString + songs.length} songs={songs} />
      </IonContent>
    </IonPage>
  );
};

export default BookPage;
