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
import { SongViewMode } from "../utils/SongUtils";
import { fetchSongsAndPopulateSongsTable, getSong } from "../database/SongsTable";
import { DbSong, PLACEHOLDER_SONG } from "../models/DbSong";
import "./Components.css";
//Import Event tracking
import { triggerSongView } from "../tracking/EventFunctions";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props: LyricViewProps) => {
  const [song, setSong] = useState<DbSong>(PLACEHOLDER_SONG);

  useEffect(() => {
    triggerSongView(props.songNumber, SongViewMode.Lyrics);
    getSong(props.songNumber, (song) => {
      if (song) {
        setSong(song);
      } else {
        fetchSongsAndPopulateSongsTable()
          .then((songs) => (songs ? songs : []))
          .then((songs) => songs[props.songNumber - 1])
          .then((song) =>
            song
              ? new DbSong(props.songNumber, "", 0, 0, false, song.author, song.title, JSON.stringify(song.lyrics))
              : PLACEHOLDER_SONG
          )
          .then((song) => setSong(song));
      }
    });
  }, []);

  return (
    <IonGrid>
      <IonRow class="ion-justify-content-center">
        <IonCol size="12" size-lg="8" size-xl="6">
          <IonCard id="lyricViewCard" className="ion-padding">
            <IonCardHeader className="ion-text-center">
              <IonCardTitle key={song?.title}>{song?.title}</IonCardTitle>
              <IonCardSubtitle key={song?.author}>By {song?.author}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent key={song?.lyrics}>{song ? getLyrics(song) : song}</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );

  /**
   * Parses all verse of the song to a string.
   */
  function getLyrics(song: DbSong): JSX.Element[] {
    const songLyrics = JSON.parse(song.lyrics);
    const verses = Object.keys(songLyrics);
    const lyrics: JSX.Element[] = [];
    let key = 0;
    verses.forEach((versenumber) => {
      // margin-top doesn't want to work on the verse number directly, so just use a spacer
      lyrics.push(
        <Fragment>
          <div className="ion-margin-vertical"></div>
        </Fragment>
      );
      lyrics.push(
        <h5 key={key} className="ion-margin-top">
          {getVerseText(versenumber)}
        </h5>
      );
      key++;
      songLyrics[versenumber].forEach((line: string) => {
        lyrics.push(
          <IonText className="lyricVerse" color="dark">
            <p>{line}</p>
          </IonText>
        );
        key++;
      });
    });
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
