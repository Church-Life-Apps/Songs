import {
  IonList,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { search } from "ionicons/icons";
import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { removePunctuation } from "../utils/SongUtils";
import "./Components.css";

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
  let songs = require("../resources/Songs_&_Hymns_Of_Life/BlackBookSongList.json");
  let songCards = GetSongsList(songs.songs);

  return <IonList>{songCards}</IonList>;

  // generate all the songs as IonCards. This should only be called once and saved.
  function GetSongsList(songs: Song[]) {
    let GenerateIonItem = (song: Song) => {
      return (
        SongMatchesSearch(song, props.searchString) && (
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

  function SongMatchesSearch(song: Song, searchString: any): boolean {
    if (
      searchString === undefined ||
      typeof searchString !== "string" ||
      searchString.trim() === ""
    ) {
      return true;
    }

    searchString = removePunctuation(searchString.trim().toLowerCase());
    let searchNumber = Number(searchString);

    if (!isNaN(searchNumber)) {
      return searchNumber === song.songNumber;
    }

    let title = removePunctuation(song.title.toLowerCase());
    let author = removePunctuation(song.author.toLowerCase());

    let searchTerms: string[] = searchString.split(" ");
    for (let s of searchTerms) {
      if (!title.includes(s) && !author.includes(s)) {
        return false;
      }
    }

    return true;
  }
};

export default SearchView;
