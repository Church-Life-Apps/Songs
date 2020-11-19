import { IonList, IonCard, IonCardTitle, IonCardSubtitle } from "@ionic/react";
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
  const { bookId } = useParams<{ bookId: string }>();
  let history = useHistory();

  let searchParam = GetSearchParam();
  let searchIsEmpty = searchParam === undefined;
  let searchIsNumber = typeof searchParam === "number";

  let songCards = GetSongsList(songs.songs);

  return <IonList>{songCards}</IonList>;

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

    if (!isNaN(searchNumber)) {
      return searchNumber;
    }

    return searchString.split(" ");
  }

  // generate all the songs as IonCards.
  function GetSongsList(songs: Song[]) {
    console.log("GetSongsList");
    let GenerateIonItem = (song: Song) => {
      return (
        SongMatchesSearch(song, searchParam, searchIsEmpty, searchIsNumber) && (
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
        )
      );
    };

    return songs.map(GenerateIonItem);
  }

  function SongMatchesSearch(
    song: Song,
    searchParam: any,
    searchIsEmpty: boolean,
    searchIsNumber: boolean
  ): boolean {
    if (searchIsEmpty) {
      return true;
    }

    if (searchIsNumber) {
      return searchParam === song.songNumber;
    }

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
