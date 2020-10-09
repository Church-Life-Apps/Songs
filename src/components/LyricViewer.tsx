import React from 'react';
import './LyricViewer.css';

interface LyricViewProps {
  songNumber: number;
}

/**
 * Lyric Viewer React Functional Component.
 */
const LyricViewer: React.FC<LyricViewProps> = (props) => {

  var data;
  try {
    data = require(`../../resources/Songs_&_Hymns_Of_Life/metadata/${props.songNumber}.json`);
  } catch {
    return <h1 className="center">No Song Found</h1>;
  }
  return (
    <div>
      <h2 className="center">{data['title']}</h2>
      <b>
          {/* I have no idea how to print these lyrics! 
          
          fyi - a couple of the songs use capitals verse numbers for some reason (ie: V1 instead of v1)
          */}
        {data['lyrics']['v1']}
      </b>

      <footer>Author: {data['author'] == '' ? 'Unknown' : data['author']}</footer>
    </div>
  );
};

export default LyricViewer;
