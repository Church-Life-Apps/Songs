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
import { updateSongHits } from "../database/SongsTable";
import { DbSong } from "../models/DbSong";
import "./Components.css";

interface SearchViewProps {
  songs: DbSong[];
}

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props: SearchViewProps) => {
  const { bookId } = useParams<{ bookId: string }>();
  const [songCards, setSongCards] = useState<JSX.Element[]>([]);
  const [songCardsIterator] = useState(props.songs.entries());

  const history = useHistory();

  if (songCards.length === 0) {
    LoadSongs(songCardsIterator, 20);
  }
  return songCards.length > 0 ? (
    <div>
      <IonList id="searchViewSongList">{songCards}</IonList>
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
    const target = event.target as HTMLIonInfiniteScrollElement;
    if (!LoadSongs(songCardsIterator, 10)) {
      target.disabled = true;
    }
    setSongCards(Array.from(songCards));
    target.complete();
  }

  function LoadSongs(songIterator: IterableIterator<[number, DbSong]>, count: number): boolean {
    while (count > 0) {
      const nextSong = songIterator.next();
      if (nextSong.done) {
        return false;
      }
      const song = nextSong.value[1];
      songCards.push(GenerateSongCard(song));
      count--;
    }

    return true;
  }

  function GenerateSongCard(song: DbSong) {
    return (
      <IonCard
        key={song.songNumber}
        onClick={() => {
          updateSongHits(song.songNumber);
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
};

export default SearchView;
