import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonGrid,
  IonRow,
  IonCol,
  IonCardTitle,
  IonText,
  IonCardSubtitle,
} from "@ionic/react";
import React, { Fragment, useEffect, useState } from "react";
import { PLACEHOLDER_SONG, Song, SongViewMode } from "../utils/SongUtils";
import "./Components.css";
//Import Event tracking
import { triggerSongView } from "../tracking/EventFunctions";
import { getSong } from "../service/SongsService";
import { useParams } from "react-router";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props: LyricViewProps) => {
  const [song, setSong] = useState<Song>(PLACEHOLDER_SONG);
  const { bookId, songId } = useParams<{ bookId: string; songId: string }>();

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Lyrics);
    getSong(props.songNumber, bookId).then(song => {
      setSong(song);
    });
  }, [songId]);

  // getSong() returns a sentinel song with songNumber === -1 when the requested
  // song number is missing or out of range (e.g. /#/<book>/0 or /#/<book>/<N+1>).
  // Render a friendly "Song not found" message instead of a blank card with a
  // stray "By" author row (#147).
  const isNotFound = !song || song.songNumber === -1;

  if (isNotFound) {
    return (
      <IonGrid>
        <IonRow class="ion-justify-content-center">
          <IonCol size="12" size-lg="8" size-xl="6" className="song-page-center">
            <IonCard id="lyricViewCard" className="ion-padding">
              <IonCardHeader className="ion-text-center">
                <IonCardTitle key="title">Song not found</IonCardTitle>
              </IonCardHeader>
              <IonCardContent key="notFound" id="lyricViewNotFound">
                <p>We couldn&apos;t find that song. It may not exist in this songbook.</p>
                <p>Please double-check the song number and try again.</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    );
  }

  return (
    <IonGrid>
      <IonRow class="ion-justify-content-center">
        <IonCol size="12" size-lg="8" size-xl="6" className="song-page-center">
          <IonCard id="lyricViewCard" className="ion-padding">
            <IonCardHeader className="ion-text-center">
              <IonCardTitle key="title">{`${song?.songNumber}) ${song?.title}`}</IonCardTitle>
              {song?.author && song.author.trim() !== "" ? (
                <IonCardSubtitle key="author">By {song.author}</IonCardSubtitle>
              ) : null}
            </IonCardHeader>
            <IonCardContent key="lyrics">{song ? getLyrics(song) : song}</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );

  /**
   * Parses all verse of the song to a list of JSX elements.
   */
  function getLyrics(song: Song): JSX.Element[] {
    const lyrics: JSX.Element[] = [];
    let key = 0;

    const songLyrics = song.lyrics;
    const presentationOrder = song.presentation?.split(" ");

    // if the song has a presentation order defined, use it;
    // otherwise, present in written order
    if (presentationOrder != null) {
      presentationOrder.forEach(verseNumber => {
        const verseName: string = getVerseText(verseNumber);
        const verseLyrics: string[] = songLyrics.get(verseNumber) || [""];

        lyrics.push(buildLyricBlock(verseName, verseLyrics, key++));
      });
    } else {
      // separate chorus(es) and normal verses
      const choruses: Map<string, string[]> = new Map();
      const nonChoruses: Map<string, string[]> = new Map();
      songLyrics.forEach((verseLyrics, verseNumber) => {
        if (verseNumber.startsWith("c")) {
          choruses.set(verseNumber, verseLyrics);
        } else {
          nonChoruses.set(verseNumber, verseLyrics);
        }
      });

      let mainChorusNumber: string, mainChorusLyrics: string[];
      if (choruses.size) {
        [mainChorusNumber, mainChorusLyrics] = choruses.entries().next().value;
      }
      nonChoruses.forEach((verseLyrics, verseNumber) => {
        const verseName = getVerseText(verseNumber);
        lyrics.push(buildLyricBlock(verseName, verseLyrics, key++));

        if (mainChorusNumber) {
          // insert chorus 1 between each verse
          const chorusName = getVerseText(mainChorusNumber);
          lyrics.push(buildLyricBlock(chorusName, mainChorusLyrics, key++));
        }
      });

      // append all choruses except for chorus 1
      choruses.forEach((chorusLyrics, chorusNumber) => {
        if (chorusNumber === mainChorusNumber) {
          return;
        }
        const chorusName = getVerseText(chorusNumber);
        lyrics.push(buildLyricBlock(chorusName, chorusLyrics, key++));
      });
    }
    return lyrics;
  }

  function getVerseText(verse: string) {
    const lower = verse.toLowerCase();
    const prefix = lower.charAt(0);
    const rest = lower.slice(1);
    const labels: { [key: string]: string } = {
      i: "Interlude",
      v: "Verse",
      c: "Chorus",
      b: "Bridge",
      p: "Pre-Chorus",
      t: "Tag",
      e: "Ending",
    };
    const label = labels[prefix];
    if (!label) return verse;
    return rest ? `${label} ${rest}` : label;
  }

  function buildLyricBlock(name: string, lines: string[], key: number) {
    const lyricsElement: JSX.Element[] = lines.map((line, index) => <p key={index}>{line}</p>);
    return (
      <Fragment key={key}>
        <div className="ion-margin-vertical"></div>
        <h5 className="ion-margin-top">{name}</h5>
        <IonText className="lyricVerse" color="dark">
          {lyricsElement}
        </IonText>
      </Fragment>
    );
  }
};

export default LyricView;
