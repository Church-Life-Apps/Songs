import { IonContent, IonPage, IonHeader, IonInput, IonItem, IonButton, IonIcon } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory, useParams } from "react-router-dom";
import { Song } from "../utils/SongUtils";
import { listSongs } from "../service/SongsService";
import { closeOutline } from "ionicons/icons";

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
        .then(songs => {
          setSongs(songs);
          localStorage.setItem("searchString", searchString);
        })
        .catch(e => console.error(e));
    }, 200);
    return () => clearTimeout(timeOutId);
  }, [searchString]);

  const history = useHistory();

  useEffect(() => {
    const savedSearchString = localStorage.getItem("searchString");
    if (savedSearchString) {
      setSearchString(savedSearchString);
    }
  }, []);

  const clearSearchText = () => {
    localStorage.removeItem("searchString");
    setSearchString("");
  };

  return (
    <IonPage>
      <IonHeader>
        <NavigationBar
          backButtonOnClick={() => {
            history.push("/");
            clearSearchText();
          }}
        />
      </IonHeader>
      <IonItem>
        <IonInput
          id="searchBar"
          type="search"
          value={searchString}
          placeholder="Search for a song"
          // Use onIonInput (fires on every keystroke) instead of onIonChange,
          // which on iOS lags one keystroke behind. In Ionic 5 the ionInput
          // event detail is a KeyboardEvent, so read the current value from the
          // input element itself to keep the field fully controlled.
          onIonInput={e => setSearchString((e.target as HTMLIonInputElement).value as string)}
        ></IonInput>
        {searchString !== "" && (
          <IonButton shape="round" fill="clear" color="medium" onClick={() => clearSearchText()}>
            <IonIcon icon={closeOutline}></IonIcon>
          </IonButton>
        )}
      </IonItem>
      {/* The key here will trigger a re-initialization of a new searchView when it changes. */}
      <IonContent>
        <SearchView key={searchString + songs.length} songs={songs} />
      </IonContent>
    </IonPage>
  );
};

export default BookPage;
