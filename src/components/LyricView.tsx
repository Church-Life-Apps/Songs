import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel } from "@ionic/react";
import React, { useEffect, useState } from "react";
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
          .then((song) => new DbSong(props.songNumber, "", 0, 0, false, song.author, song.title, song.lyrics))
          .then((song) => setSong(song));
      }
    });
  }, []);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle key={song?.title}>{song?.title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent key={song?.lyrics}>{song ? getLyrics(song) : song}</IonCardContent>
    </IonCard>
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
      lyrics.push(<IonLabel key={key}>{getVerseText(versenumber)}</IonLabel>);
      key++;
      songLyrics[versenumber].forEach((line: string) => {
        lyrics.push(
          <IonItem key={key} lines="none">
            <IonLabel className="ion-text-wrap">{line}</IonLabel>
          </IonItem>
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
