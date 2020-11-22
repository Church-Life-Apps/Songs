import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
} from "@ionic/react";
import React from "react";
import { BlackBookSongs, Song } from "../utils/SongUtils";
import "./Components.css";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props) => {
  if (props.songNumber > BlackBookSongs.length) {
    return <IonItem lines="none">No song found.</IonItem>;
  }

  let song: Song = BlackBookSongs[props.songNumber - 1];

  let lyrics = getLyrics(BlackBookSongs[props.songNumber - 1]);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{song.title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>{lyrics}</IonCardContent>
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
