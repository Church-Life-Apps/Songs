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
import { removePunctuation, Song } from "../utils/SongUtils";
import "./Components.css";

interface SearchViewProps {
  searchString: string;
  songs: Song[];
}

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props: SearchViewProps) => {
  const { bookId } = useParams<{ bookId: string }>();
  const [songCards, setSongCards] = useState<JSX.Element[]>([]);
  const [songCardsIterator] = useState(props.songs.entries());

  const history = useHistory();
  const searchParam = GetSearchParam();
  const searchIsNumber = typeof searchParam === "number";

  if (searchIsNumber) {
    songCards.push(GenerateSongCard(props.songs[(searchParam as number) - 1]));
  } else {
    if (songCards.length === 0) {
      LoadSongs(songCardsIterator, 20, searchParam as string[]);
    }
  }

  return songCards.length > 0 ? (
    <div>
      <IonList>{songCards}</IonList>
      <IonInfiniteScroll onIonInfinite={LoadMoreSongs} disabled={searchIsNumber}>
        <IonInfiniteScrollContent
          loadingSpinner="bubbles"
          loadingText="Loading more songs..."
        ></IonInfiniteScrollContent>
      </IonInfiniteScroll>
    </div>
  ) : props.searchString !== "" ? (
    <IonItem>
      <IonLabel>No results found</IonLabel>
    </IonItem>
  ) : null;

  function LoadMoreSongs(event: CustomEvent<void>) {
    const target = event.target as HTMLIonInfiniteScrollElement;
    if (!LoadSongs(songCardsIterator, 10, searchParam as string[])) {
      target.disabled = true;
    }
    setSongCards(Array.from(songCards));
    target.complete();
  }

  function LoadSongs(songIterator: IterableIterator<[number, Song]>, count: number, searchParam: string[]): boolean {
    while (count > 0) {
      const nextSong = songIterator.next();
      if (nextSong.done) {
        return false;
      }

      const song = nextSong.value[1];

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
      return [];
    }

    const searchString = removePunctuation(props.searchString.trim().toLowerCase());
    const searchNumber = Number(searchString);

    if (!isNaN(searchNumber) && searchNumber > 0 && searchNumber <= props.songs.length) {
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
        className="hymnalListView"
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

    const title = removePunctuation(song.title.toLowerCase());
    const author = removePunctuation(song.author.toLowerCase());

    for (const s of searchParam) {
      if (!title.includes(s) && !author.includes(s)) {
        return false;
      }
    }

    return true;
  }
};

export default SearchView;
