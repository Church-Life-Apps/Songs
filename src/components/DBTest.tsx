import React, { useState } from "react";
import "./Components.css";
import { makeThreeDigits } from "../utils/SongUtils";
import { IonButton, IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import { Plugins } from "@capacitor/core";
import { clearCache, getItem, storeItem } from "../utils/StorageUtils";
import { logPromiseTime } from "../utils/DebuggingUtils";
import { listSongsBySearchText, populateDatabase, updateSongFavorited } from "../database/SongsTable";
import { DbSong } from "../models/DbSong";
import { logPlatforms } from "../utils/PlatformUtils";

const songsWithTwoTunes = [156, 216, 278, 478];

// Props are kind of like the parameters for the constructor of this class.
interface SongViewProps2 {
  songNumber: number;
}

/**
 * Song Viewer React Functional Component.
 */
const DBTest: React.FC<SongViewProps2> = (props) => {
  const [data, setData] = useState<string>("beginning data");
  const [songsList, setSongsList] = useState<DbSong[]>([]);

  if (props.songNumber === 99) {
    clearCache();
    // clearDatabase();
  }

  logPlatforms();

  let s = new DbSong(13, 1, 12, Date.now(), true, "watchman nee", "let me love", "let me love and not");

  console.log("s = " + s);

  // TODO: Add Pinch and Zoom to image.
  return (
    <div>
      {/* image */}
      {/* data:image/png;base64,{PLACE_YOUR_BASE64_DATA_HERE} */}

      <IonItem>
        <IonButton
          onClick={() => {
            updateSongFavorited(props.songNumber, true);
          }}
        >
          favorite song
        </IonButton>
      </IonItem>

      <IonItem>
        <IonButton
          onClick={() => {
            // populateDatabase();
          }}
        >
          add all songs
        </IonButton>
      </IonItem>

      <IonItem>
        <IonButton
          onClick={() => {
            // clearDatabase();
          }}
        >
          DELETE all songs
        </IonButton>
      </IonItem>

      <IonItem>
        <IonButton
          onClick={() => {
            listSongsBySearchText("watchman", populateSongs);
          }}
        >
          list songs
        </IonButton>
      </IonItem>
      <IonItem>
        <IonLabel id="lyricTextBox">{data}</IonLabel>
      </IonItem>

      {/* <img src={`data:image/png;base64,${bytes}`} alt={alt} /> */}
    </div>
  );

  function populateSongs(songs: DbSong[]): void {
    console.log("returned songs = " + songs);
    // console.log(
    //   'songs = ' +
    //     songs.map((it) => {
    //       return '' + it.songNumber;
    //     })
    // );
    let n = "NUMS = ";
    for (var i = 0; i < songs.length; ++i) {
      n += songs[i].songNumber + ", ";
    }
    setData(n);
  }
};
export default DBTest;
