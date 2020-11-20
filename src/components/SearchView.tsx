import {
  IonList,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonItem,
} from "@ionic/react";
import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { removePunctuation } from "../utils/SongUtils";
import "./Components.css";
import songs from "../resources/Songs_&_Hymns_Of_Life/BlackBookSongList.json";

interface SearchViewProps {
  searchString: any;
}

interface Song {
  title: string;
  author: string;
  songNumber: number;
}

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props) => {
<<<<<<< HEAD
  let songs = require("../resources/Songs_&_Hymns_Of_Life/BlackBookSongList.json");
  // console.log(songs.songs);
=======
  const { bookId } = useParams<{ bookId: string }>();
  let history = useHistory();

  let searchParam = GetSearchParam();
  let searchIsEmpty = searchParam === undefined;
  let searchIsNumber = typeof searchParam === "number";

  let songCards: JSX.Element[];
  if (searchIsEmpty) {
    songCards = [];
  } else if (searchIsNumber) {
    songCards = [GenerateSongCard(songs.songs[(searchParam as number) - 1])];
  } else {
    songCards = songs.songs
      .filter((s) => SongMatchesSearch(s, searchParam))
      .map((s) => GenerateSongCard(s) as JSX.Element);
  }
>>>>>>> master

  return songCards.length > 0 ? (
    <IonList>{songCards}</IonList>
  ) : (
    <IonItem>
      <IonLabel>No results found</IonLabel>
    </IonItem>
  );

  function GetSearchParam() {
    if (
      props.searchString === undefined ||
      typeof props.searchString !== "string" ||
      props.searchString.trim() === ""
    ) {
      return undefined;
    }

    let searchString = removePunctuation(
      props.searchString.trim().toLowerCase()
    );
    let searchNumber = Number(searchString);

    if (
      !isNaN(searchNumber) &&
      searchNumber > 0 &&
      searchNumber <= songs.songs.length
    ) {
      return searchNumber;
    }

    return searchString.split(" ");
  }

  function GenerateSongCard(song: Song) {
    return (
      <IonCard
        key={song.songNumber}
        onClick={() => {
          history.push(`/${bookId}/${song.songNumber}`);
        }}
      >
        <IonCardTitle>
          {song.songNumber}. {song.title}
        </IonCardTitle>
        <IonCardSubtitle>{song.author}</IonCardSubtitle>
      </IonCard>
    );
  }

  function SongMatchesSearch(song: Song, searchParam: any): boolean {
    let title = removePunctuation(song.title.toLowerCase());
    let author = removePunctuation(song.author.toLowerCase());

    for (let s of searchParam) {
      if (!title.includes(s) && !author.includes(s)) {
        return false;
      }
    }

    return true;
  }
};

export default SearchView;
