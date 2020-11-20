import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
} from "@ionic/react";
import React from "react";
import "./Components.css";

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricView: React.FC<LyricViewProps> = (props) => {
  var data;
  try {
    data = require(`../resources/Songs_&_Hymns_Of_Life/metadata/${props.songNumber}.json`);
  } catch {
    return <h1 className="center">No Song Found</h1>;
  }
  let lyrics = getLyrics(data);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{data["title"]}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>{lyrics}</IonCardContent>
    </IonCard>
  );

  /**
   * Parses all verse of the song to a string.
   */
  function getLyrics(data: any) {
    let verses = Object.keys(data["lyrics"]);
    var lyrics: JSX.Element[] = [];
    let key = 0;
    verses.forEach((versenumber) => {
      lyrics.push(<IonLabel key={key}>{getVerseText(versenumber)}</IonLabel>);
      key++;
      data["lyrics"][versenumber].forEach((line: string) => {
        lyrics.push(
          <IonItem key={key}>
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
