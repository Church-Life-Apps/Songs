import React, { useState } from 'react';
import './Components.css';
import { makeThreeDigits } from '../utils/SongUtils';
import { IonToggle } from '@ionic/react';
import { Plugins } from '@capacitor/core';
import { clearCache, getItem, storeItem } from '../utils/StorageUtils';
import { logPromiseTime } from '../utils/DebuggingUtils';

const { Storage } = Plugins;

const baseUrl = 'https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/';
const hymnalPart = 'SongsAndHymnsOfLife/SHL_'; // This part can change when red book is added
const imageSuffix = '.png';
const alt = 'No Song Found';

const songsWithTwoTunes = [156, 216, 278, 478];

// Props are kind of like the parameters for the constructor of this class.
interface SongViewProps {
  songNumber: number;
}

/**
 * Song Viewer React Functional Component.
 */
const SongViewer: React.FC<SongViewProps> = (props) => {
  const [secondTune, setSecondTune] = useState<boolean>(false);
  const [bytes, setBytes] = useState<string>('');

  let songHasTwoTunes = songsWithTwoTunes.includes(props.songNumber);

  let secondTuneSuffix = songHasTwoTunes && secondTune ? '-B' : '';

  let url = baseUrl + hymnalPart + makeThreeDigits(props.songNumber) + secondTuneSuffix + imageSuffix;

  // getData();

  if (props.songNumber === 99) {
    clearCache();
  }


  // TODO: Add Pinch and Zoom to image.
  return (
    <div>
      {/* Second Tune Toggler  */}
      {songHasTwoTunes ? (
        <div id="songTogglerDiv">
          <IonToggle checked={secondTune} onIonChange={(e) => setSecondTune(!secondTune)}></IonToggle>
        </div>
      ) : null}

      {/* image */}
      {/* data:image/png;base64,{PLACE_YOUR_BASE64_DATA_HERE} */}

      <img src={url} alt={alt} />

      {/* <img src={`data:image/png;base64,${bytes}`} alt={alt} /> */}
    </div>
  );

  async function getData() {
    logPromiseTime(getItem(url), 'Getting image from cache');
    getItem(url).then((imageBytes) => {
      if (imageBytes !== '') {
        console.log('Retrieved cached song #' + props.songNumber);
        if (bytes !== imageBytes) {
          setBytes(imageBytes);
        }
        return imageBytes;
      } else {

        logPromiseTime(fetch(url), 'Fetching image from github');

        fetch(url).then((response) => {
          if (!response.ok) {
            console.log('Error on fetching, returning healthily.');
            return;
          }

          response.arrayBuffer().then((arrayBuffer) => {
            imageBytes = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            console.log('Cache miss - Storing song #' + props.songNumber);
            logPromiseTime(storeItem(url, imageBytes), 'Storing image in cache');
            
            if (imageBytes !== bytes) {
              setBytes(imageBytes);
            }
          });
        });
      }
    });
  }
};

export default SongViewer;
