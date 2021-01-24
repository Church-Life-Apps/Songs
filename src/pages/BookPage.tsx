import { IonContent, IonPage, IonHeader, IonInput, IonItem } from "@ionic/react";
import NavigationBar from "../components/NavigationBar";
import React, { useEffect, useState } from "react";
import SearchView from "../components/SearchView";
import { useHistory } from "react-router-dom";
import { SHL_BOOK_ID } from "../utils/SongUtils";
import { fetchSongsAndPopulateSongsTable, listSongsBySearchText } from "../database/SongsTable";
import { DbSong, sortDbSongs } from "../models/DbSong";
import { getSimilarity, isNumeric } from "../utils/StringUtils";
import { DbManager } from "../database/DbManager";

const MATCH_THRESHOLD = 0.25;

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
    const timeOutId = setTimeout(() => {
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
        } else if (songs.length === 0 && !DbManager.isInitialized()) {
          fetchSongsAndPopulateSongsTable()
            .then((songs) => (songs ? songs : []))
            .then((songs) => {
              if (isNumeric(searchString)) {
                return songs[+searchString - 1] ? [songs[+searchString - 1]] : [];
              } else {
                return songs.filter(
                  (song) =>
                    getSimilarity(song.title, searchString) > MATCH_THRESHOLD ||
                    getSimilarity(song.author, searchString) > MATCH_THRESHOLD
                );
              }
            })
            .then((songs) =>
              songs.map((song) => {
                return new DbSong(song.songNumber, SHL_BOOK_ID, 0, 0, false, song.author, song.title, song.lyrics);
              })
            )
            .then((songs) => sortDbSongs(songs, searchString))
            .then((songs) => setSongs(songs));
        } else {
          setSongs(songs);
        }
      });
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
