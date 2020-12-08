import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { Song } from "../utils/SongUtils";
import { getShlSongs } from "../utils/StorageUtils";
import "./Components.css";
//Import Event tracking
import { Event } from "../components/Tracking";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props) => {
  const [song, setSong] = useState<Song>();

  GAEvent(props.songNumber);

  useEffect(() => {
    getShlSongs()
      .then((songs) => songs[props.songNumber - 1])
      .then(setSong)
      .catch((r) => {
        console.error(r);
        return <IonItem lines="none">No song found.</IonItem>;
      });
  }, [props.songNumber]);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle key={song?.title}>{song?.title}</IonCardTitle>
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

function GAEvent(songNumber : number){
  try {
    Event("INTERACTION", "Song viewed(lyric)", String(songNumber));
    console.log("Song number: "+String(songNumber)+" viewed in lyric mode");
  } catch (e) {
    console.error(e);
  }
}

export default LyricView;
