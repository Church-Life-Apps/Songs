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

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props: LyricViewProps) => {
  const [song, setSong] = useState<Song>(PLACEHOLDER_SONG);

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Lyrics);
    getSong(props.songNumber).then((song) => {
      setSong(song);
    });
  }, []);

  return (
    <IonGrid>
      <IonRow class="ion-justify-content-center">
        <IonCol size="12" size-lg="8" size-xl="6">
          <IonCard id="lyricViewCard" className="ion-padding">
            <IonCardHeader className="ion-text-center">
              <IonCardTitle key="title">{song?.title}</IonCardTitle>
              <IonCardSubtitle key="author">By {song?.author}</IonCardSubtitle>
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
    const verseKeys = Object.keys(songLyrics);
    const lyricBlocks: string[][] = Object.values(songLyrics);

    for (let i = 0; i < verseKeys.length; ++i) {
      const verseKey = verseKeys[i];
      const verseLyrics = lyricBlocks[i];

      lyrics.push(
        <Fragment key={key++}>
          <div className="ion-margin-vertical"></div>
        </Fragment>
      );
      lyrics.push(
        <h5 key={key++} className="ion-margin-top">
          {getVerseText(verseKey)}
        </h5>
      );
      verseLyrics.forEach((line: string) => {
        lyrics.push(
          <IonText key={key++} className="lyricVerse" color="dark">
            <p>{line}</p>
          </IonText>
        );
      });
    }
    return lyrics;
  }

  function getVerseText(verse: string) {
    return verse
      .toLowerCase()
      .replace("v", "Verse ")
      .replace("c", "Chorus ")
      .replace("b", "Bridge ")
      .replace("p", "Pre-Chorus ");
  }
};

export default LyricView;
