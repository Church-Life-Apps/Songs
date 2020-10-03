import React from 'react';
import './SongViewer.css';
import { makeThreeDigits } from '../utils/SongUtils';

const baseUrl = 'https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/';
const hymnalPart = 'SongsAndHymnsOfLife/SHL_'; // This part can change when red book is added
const imageSuffix = '.png';
const alt = 'No Song Found';

// Props are kind of like the parameters for the constructor of this class.
interface SongViewProps {
  songNumber: number;
}

/**
 * Song Viewer React Functional Component.
 * 
 * TODO: Handle songs with two tunes. Like SHL_156.
 */
const SongViewer: React.FC<SongViewProps> = (props) => {
  let url = baseUrl + hymnalPart + makeThreeDigits(props.songNumber) + imageSuffix;

  // TODO: Add on click to the image to zoom in and out (potentially automatic on mobile though).
  return <img src={url} alt={alt} />;
};

export default SongViewer;
