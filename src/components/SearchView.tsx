import {
  IonList,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonItem,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import React, { useState } from "react";
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
  const [songCards, setSongCards] = useState<JSX.Element[]>([]);
  const [songCardsIterator] = useState(songs.songs.entries());

  let history = useHistory();
  let searchParam = GetSearchParam();

  if (typeof searchParam === "number") {
    setSongCards([GenerateSongCard(songs.songs[(searchParam as number) - 1])]);
  } else {
    if (songCards.length === 0) {
      LoadSongs(songCardsIterator, 20, searchParam as string[]);
    }
  }

  return songCards.length > 0 ? (
    <div>
      <IonList>{songCards}</IonList>
      <IonInfiniteScroll onIonInfinite={LoadMoreSongs}>
        <IonInfiniteScrollContent
          loadingSpinner="bubbles"
          loadingText="Loading more songs..."
        ></IonInfiniteScrollContent>
      </IonInfiniteScroll>
    </div>
  ) : (
    <IonItem>
      <IonLabel>No results found</IonLabel>
    </IonItem>
  );

  function LoadMoreSongs(event: CustomEvent<void>) {
    let target = event.target as HTMLIonInfiniteScrollElement;
    if (!LoadSongs(songCardsIterator, 10, searchParam as string[])) {
      target.disabled = true;
    }
    setSongCards(Array.from(songCards));
    target.complete();
  }

  function LoadSongs(
    songIterator: IterableIterator<[number, Song]>,
    count: number,
    searchParam: string[]
  ): boolean {
    while (count > 0) {
      let nextSong = songIterator.next();
      if (nextSong.done) {
        return false;
      }

      let song = nextSong.value[1];

      if (SongMatchesSearch(song, searchParam)) {
        songCards.push(GenerateSongCard(song));
        count--;
      }
    }

    return true;
  }

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

  function SongMatchesSearch(song: Song, searchParam: string[]): boolean {
    if (searchParam === undefined || searchParam.length === 0) {
      return true;
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
