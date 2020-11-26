import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
} from "@ionic/react";
<<<<<<< HEAD
import React from "react";
import { BlackBookSongs, Song } from "../utils/SongUtils";
=======
import React, { useEffect, useState } from "react";
import { Song } from "../utils/SongUtils";
import { getShlSongs } from "../utils/StorageUtils";
>>>>>>> master
import "./Components.css";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props) => {
<<<<<<< HEAD
  if (props.songNumber > BlackBookSongs.length) {
    return <IonItem lines="none">No song found.</IonItem>;
  }

  let song: Song = BlackBookSongs[props.songNumber - 1];

  let lyrics = getLyrics(BlackBookSongs[props.songNumber - 1]);
=======
  const [song, setSong] = useState<Song>();

  useEffect(() => {
    getShlSongs()
      .then((songs) => songs[props.songNumber - 1])
      .then(setSong)
      .catch((r) => {
        console.error(r);
        return <IonItem lines="none">No song found.</IonItem>;
      });
  }, [props.songNumber]);
>>>>>>> master

  return (
    <IonCard>
      <IonCardHeader>
<<<<<<< HEAD
        <IonCardTitle>{song.title}</IonCardTitle>
=======
        <IonCardTitle key={song?.title}>{song?.title}</IonCardTitle>
>>>>>>> master
      </IonCardHeader>
      <IonCardContent key={song?.lyrics}>
        {song ? getLyrics(song) : song}
      </IonCardContent>
    </IonCard>
  );

  /**
   * Parses all verse of the song to a string.
   */
  function getLyrics(song: Song) {
    let verses = Object.keys(song.lyrics);
    var lyrics: JSX.Element[] = [];
    let key = 0;
    verses.forEach((versenumber) => {
      lyrics.push(<IonLabel key={key}>{getVerseText(versenumber)}</IonLabel>);
      key++;
      song.lyrics[versenumber].forEach((line: string) => {
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
