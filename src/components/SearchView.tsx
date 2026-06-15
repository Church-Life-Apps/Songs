import {
  IonList,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonItem,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Song } from "../utils/SongUtils";
import "./Components.css";

interface SearchViewProps {
  songs: Song[];
}

const INITIAL_PAGE_SIZE = 30;
const PAGE_SIZE = 10;

/**
 * Search View.
 */
const SearchView: React.FC<SearchViewProps> = (props: SearchViewProps) => {
  const { bookId } = useParams<{ bookId: string }>();
  const [songCards, setSongCards] = useState<JSX.Element[]>([]);
  const [songCardsIterator] = useState(props.songs.entries());
  // Whether the iterator has been exhausted (all songs rendered).
  const [allLoaded, setAllLoaded] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  if (songCards.length === 0) {
    LoadSongs(songCardsIterator, INITIAL_PAGE_SIZE);
  }

  // #242: On viewports tall enough to fit the entire initial page without any
  // vertical overflow, IonInfiniteScroll's onIonInfinite never fires (there is
  // nothing to scroll), leaving the rest of the songs unreachable. After every
  // render, if the scroll container is not overflowing and songs remain, keep
  // loading the next page until it overflows or all songs are loaded.
  useEffect(() => {
    if (allLoaded) {
      return;
    }
    let cancelled = false;

    const isOverflowing = (): boolean => {
      // Prefer the nearest Ionic scroll container; fall back to the document.
      const wrapper = wrapperRef.current;
      const ionContent = wrapper ? wrapper.closest("ion-content") : null;
      const inner = ionContent ? (ionContent.querySelector(".inner-scroll") as HTMLElement | null) : null;
      if (inner) {
        return inner.scrollHeight > inner.clientHeight + 1;
      }
      const doc = document.documentElement;
      return doc.scrollHeight > doc.clientHeight + 1;
    };

    // Defer to after layout so heights are measured post-paint.
    const handle = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (!isOverflowing()) {
        const more = LoadSongs(songCardsIterator, PAGE_SIZE);
        setSongCards(Array.from(songCards));
        if (!more) {
          setAllLoaded(true);
        }
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [songCards, allLoaded]);

  return songCards.length > 0 ? (
    <div ref={wrapperRef}>
      <IonList id="searchViewSongList">{songCards}</IonList>
      <IonInfiniteScroll disabled={allLoaded} onIonInfinite={LoadMoreSongs}>
        <IonInfiniteScrollContent
          loadingSpinner="bubbles"
          loadingText="Loading more songs..."
        ></IonInfiniteScrollContent>
      </IonInfiniteScroll>
      {/* Fallback for tall viewports where the infinite-scroll trigger has
          nothing to observe (#242): an explicit button to load the next page. */}
      {!allLoaded && (
        <IonButton
          id="loadMoreSongsButton"
          expand="block"
          fill="clear"
          onClick={() => {
            const more = LoadSongs(songCardsIterator, PAGE_SIZE);
            setSongCards(Array.from(songCards));
            if (!more) {
              setAllLoaded(true);
            }
          }}
        >
          Load more songs
        </IonButton>
      )}
    </div>
  ) : (
    <IonItem>
      <IonLabel>No results found</IonLabel>
    </IonItem>
  );

  function LoadMoreSongs(event: CustomEvent<void>) {
    const target = event.target as HTMLIonInfiniteScrollElement;
    if (!LoadSongs(songCardsIterator, PAGE_SIZE)) {
      target.disabled = true;
      setAllLoaded(true);
    }
    setSongCards(Array.from(songCards));
    target.complete();
  }

  function LoadSongs(songIterator: IterableIterator<[number, Song]>, count: number): boolean {
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

  function GenerateSongCard(song: Song) {
    return (
      <IonCard
        key={song.songNumber}
        onClick={() => {
          history.push(`/${bookId}/${song.songNumber}`);
        }}
        className="hymnalListView"
        style={{ padding: "10px", margin: "6px" }}
      >
        <IonCardTitle style={{ fontSize: "20px" }}>
          {song.songNumber}. {song.title}
        </IonCardTitle>
        <IonCardSubtitle style={{ fontSize: "14px" }}>{song.author}</IonCardSubtitle>
      </IonCard>
    );
  }
};

export default SearchView;
