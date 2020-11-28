import { IonContent, IonPage, IonItem, IonHeader, IonSearchbar } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory } from "react-router-dom";
import { SHL_BOOK_ID } from "../utils/SongUtils";
import { cancelAllTransactions, fetchSongsAndPopulateSongsTable, listSongsBySearchText } from "../database/SongsTable";
import { DbSong } from "../models/DbSong";

/**
 * Book Page Component.
 *
 * Use 'useState' for dynamic variables.
 * When the variable changes, the places where it's being used are automatically re-rendered.
 */
const BookPage: React.FC = () => {
  // the search string inputted by the user
  const [searchString, setSearchString] = useState<string>("");
  const [songs, setSongs] = useState<DbSong[]>([]);

  useEffect(() => {
    cancelAllTransactions();
    listSongsBySearchText(searchString, (songs) => {
      if (songs.length === 0 && searchString === "") {
        // The Database did not return anything, so fetch songs list from online and try to populate the DB for next time.
        fetchSongsAndPopulateSongsTable()
          .then((songs) => (songs ? songs : []))
          .then((songs) =>
            songs.map((song) => {
              return new DbSong(song.songNumber, SHL_BOOK_ID, 0, 0, false, song.author, song.title, song.lyrics);
            })
          )
          .then((songs) => setSongs(songs));
      } else {
        setSongs(songs);
      }
    });
  }, [searchString]);

  const history = useHistory();

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
          onIonChange={(e) => setSearchString(e.detail.value as string)}
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
