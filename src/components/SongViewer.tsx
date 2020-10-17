import React, { useState } from 'react';
import './SongViewer.css';
import { makeThreeDigits } from '../utils/SongUtils';
import { IonToggle } from '@ionic/react';

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

  let songHasTwoTunes = songsWithTwoTunes.includes(props.songNumber);

  let secondTuneSuffix = songHasTwoTunes && secondTune ? '-B' : '';

  let url = baseUrl + hymnalPart + makeThreeDigits(props.songNumber) + secondTuneSuffix + imageSuffix;

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
      <img src={url} alt={alt} />
    </div>
  );
};

export default SongViewer;
